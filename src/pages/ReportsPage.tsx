import DownloadIcon from '@mui/icons-material/Download'
import PrintIcon from '@mui/icons-material/Print'
import UploadIcon from '@mui/icons-material/Upload'
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { useMemo, useRef, useState } from 'react'
import { db, type TransactionType } from '../db'
import { formatCurrency, startOfMonthISO, todayISO } from '../utils/format'

function safeFilename(name: string) {
  return name.replaceAll(/[<>:"/\\|?*]/g, '-').replaceAll(/\s+/g, ' ').trim()
}

type BackupDataV1 = {
  version: 1
  exportedAt: string
  tables: Record<string, unknown[]>
}

const ReportsPage = () => {
  const [from, setFrom] = useState(startOfMonthISO())
  const [to, setTo] = useState(todayISO())
  const [type, setType] = useState<'all' | TransactionType>('all')
  const [groupBy, setGroupBy] = useState<'category' | 'account'>('category')

  const fileRef = useRef<HTMLInputElement | null>(null)

  const data = useLiveQuery(async () => {
    const [txs, categories, accounts] = await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
      db.accounts.toArray(),
    ])
    return { txs, categories, accounts }
  }, [])

  const nameByCategoryId = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of data?.categories ?? []) if (c.id != null) m.set(c.id, c.name)
    return m
  }, [data?.categories])

  const nameByAccountId = useMemo(() => {
    const m = new Map<number, string>()
    for (const a of data?.accounts ?? []) if (a.id != null) m.set(a.id, a.name)
    return m
  }, [data?.accounts])

  const filtered = useMemo(() => {
    return (data?.txs ?? [])
      .filter((t) => (type === 'all' ? true : t.type === type))
      .filter((t) => (from ? t.date >= from : true))
      .filter((t) => (to ? t.date <= to : true))
  }, [data?.txs, from, to, type])

  const summary = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of filtered) {
      if (t.type === 'income') income += t.amount
      if (t.type === 'expense') expense += t.amount
    }
    return { income, expense, net: income - expense }
  }, [filtered])

  const rows = useMemo(() => {
    const m = new Map<string, { key: string; name: string; income: number; expense: number }>()
    for (const t of filtered) {
      const key = groupBy === 'category' ? `c:${t.categoryId}` : `a:${t.accountId}`
      const name =
        groupBy === 'category'
          ? nameByCategoryId.get(t.categoryId) ?? `#${t.categoryId}`
          : nameByAccountId.get(t.accountId) ?? `#${t.accountId}`
      const cur = m.get(key) ?? { key, name, income: 0, expense: 0 }
      if (t.type === 'income') cur.income += t.amount
      if (t.type === 'expense') cur.expense += t.amount
      m.set(key, cur)
    }
    return Array.from(m.values()).map((x) => ({
      id: x.key,
      name: x.name,
      income: x.income,
      expense: x.expense,
      net: x.income - x.expense,
    }))
  }, [filtered, groupBy, nameByAccountId, nameByCategoryId])

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: groupBy === 'category' ? 'Категория' : 'Счёт', flex: 1, minWidth: 220 },
      {
        field: 'income',
        headerName: 'Доход',
        width: 140,
        valueGetter: (_v, row) => formatCurrency(row.income),
      },
      {
        field: 'expense',
        headerName: 'Расход',
        width: 140,
        valueGetter: (_v, row) => formatCurrency(row.expense),
      },
      {
        field: 'net',
        headerName: 'Итог',
        width: 140,
        valueGetter: (_v, row) => formatCurrency(row.net),
      },
    ],
    [groupBy],
  )

  const exportBackup = async () => {
    const tables = {
      members: await db.members.toArray(),
      accounts: await db.accounts.toArray(),
      categories: await db.categories.toArray(),
      transactions: await db.transactions.toArray(),
      budgets: await db.budgets.toArray(),
      goals: await db.goals.toArray(),
    }

    const payload: BackupDataV1 = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tables,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `family-finance-backup-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = async (file: File) => {
    const text = await file.text()
    const parsed = JSON.parse(text) as BackupDataV1
    if (!parsed || parsed.version !== 1 || typeof parsed.tables !== 'object') {
      alert('Неверный формат бэкапа.')
      return
    }

    const t = parsed.tables
    await db.transaction(
      'rw',
      [db.members, db.accounts, db.categories, db.transactions, db.budgets, db.goals],
      async () => {
      await Promise.all([
        db.members.clear(),
        db.accounts.clear(),
        db.categories.clear(),
        db.transactions.clear(),
        db.budgets.clear(),
        db.goals.clear(),
      ])

      await db.members.bulkPut((t.members ?? []) as any[])
      await db.accounts.bulkPut((t.accounts ?? []) as any[])
      await db.categories.bulkPut((t.categories ?? []) as any[])
      await db.transactions.bulkPut((t.transactions ?? []) as any[])
      await db.budgets.bulkPut((t.budgets ?? []) as any[])
      await db.goals.bulkPut((t.goals ?? []) as any[])
      },
    )
  }

  const wipeAll = async () => {
    if (!confirm('Удалить ВСЕ данные приложения на этом устройстве?')) return
    await db.transaction(
      'rw',
      [db.members, db.accounts, db.categories, db.transactions, db.budgets, db.goals],
      async () => {
      await Promise.all([
        db.members.clear(),
        db.accounts.clear(),
        db.categories.clear(),
        db.transactions.clear(),
        db.budgets.clear(),
        db.goals.clear(),
      ])
      },
    )
    alert('Данные удалены. Перезагрузите страницу.')
  }

  const periodLabel =
    from && to
      ? `${from} — ${to}`
      : from
        ? `c ${from}`
        : to
          ? `по ${to}`
          : 'за всё время'

  const nowLabel = useMemo(
    () => new Date().toLocaleString('ru-RU'),
    [],
  )

  const handleDownloadDocx = async () => {
    const borders = {
      top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      insideH: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      insideV: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    }

    const tableRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: groupBy === 'category' ? 'Категория' : 'Счёт', bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Доход', bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Расход', bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Итог', bold: true })],
              }),
            ],
          }),
        ],
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(r.name)] }),
              new TableCell({
                children: [new Paragraph({ text: formatCurrency(r.income), alignment: AlignmentType.LEFT })],
              }),
              new TableCell({
                children: [new Paragraph({ text: formatCurrency(r.expense), alignment: AlignmentType.LEFT })],
              }),
              new TableCell({
                children: [new Paragraph({ text: formatCurrency(r.net), alignment: AlignmentType.LEFT })],
              }),
            ],
          }),
      ),
    ]

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              children: [
                new TextRun({
                  text: 'Отчёт по движениям средств',
                  bold: true,
                  underline: {},
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              children: [new TextRun({ text: `Период: ${periodLabel}` })],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders,
              rows: tableRows,
            }),
            new Paragraph({
              text: '',
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Итого по периоду — ', bold: true }),
                new TextRun({ text: `доход: ${formatCurrency(summary.income)}, ` }),
                new TextRun({ text: `расход: ${formatCurrency(summary.expense)}, ` }),
                new TextRun({ text: `итог: ${formatCurrency(summary.net)}.` }),
              ],
            }),
            new Paragraph({
              text: `Дата составления отчёта: ${nowLabel}`,
              spacing: { before: 200 },
            }),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = safeFilename(`Отчёт по движениям средств (${periodLabel}).docx`)
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack spacing={2.5} className="print-container">
      <Box className="print-header">
        <Typography variant="h4" fontWeight={600}>
          Отчёты
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Сводка доходов и расходов за выбранный период. Можно распечатать, сохранить резервную копию или восстановить
          данные.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 2 }} className="no-print">
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <TextField
              label="С даты"
              type="date"
              fullWidth
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="По дату"
              type="date"
              fullWidth
              value={to}
              onChange={(e) => setTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Тип</InputLabel>
              <Select
                label="Тип"
                value={type}
                onChange={(e) => setType(e.target.value as 'all' | TransactionType)}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="expense">Расход</MenuItem>
                <MenuItem value="income">Доход</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Группировка</InputLabel>
              <Select
                label="Группировка"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'category' | 'account')}
              >
                <MenuItem value="category">По категориям</MenuItem>
                <MenuItem value="account">По счетам</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              sx={{ height: '100%' }}
              alignItems="center"
            >
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handleDownloadDocx}
                sx={{ minWidth: 120 }}
              >
                Печать
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportBackup}
                sx={{ minWidth: 120 }}
              >
                Экспорт
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => fileRef.current?.click()}
                sx={{ minWidth: 120 }}
              >
                Импорт
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (confirm('Импорт заменит текущие данные. Продолжить?')) await importBackup(f)
                  e.target.value = ''
                }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Alert severity="info" sx={{ flexGrow: 1 }}>
            Доход: <b>{formatCurrency(summary.income)}</b> · Расход: <b>{formatCurrency(summary.expense)}</b> · Итог:{' '}
            <b>{formatCurrency(summary.net)}</b>
          </Alert>
          <Button color="error" variant="text" onClick={wipeAll} className="no-print">
            Очистить данные
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={3} sx={{ height: 560 }} className="no-print">
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            sorting: { sortModel: [{ field: 'expense', sort: 'desc' }] },
          }}
        />
      </Paper>

      <Box className="print-only print-table">
        <Typography variant="h6" gutterBottom>
          Отчёт по движениям средств
        </Typography>
        <Typography className="print-meta">
          Дата формирования: {nowLabel}
          <br />
          Период: {periodLabel}
          <br />
          Группировка: {groupBy === 'category' ? 'по категориям' : 'по счетам'}
        </Typography>
        <table>
          <thead>
            <tr>
              <th>{groupBy === 'category' ? 'Категория' : 'Счёт'}</th>
              <th>Доход</th>
              <th>Расход</th>
              <th>Итог</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{formatCurrency(r.income)}</td>
                <td>{formatCurrency(r.expense)}</td>
                <td>{formatCurrency(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Typography className="print-summary">
          Итого по периоду — доход: {formatCurrency(summary.income)}, расход: {formatCurrency(summary.expense)},
          итог: {formatCurrency(summary.net)}.
        </Typography>
      </Box>
    </Stack>
  )
}

export default ReportsPage

