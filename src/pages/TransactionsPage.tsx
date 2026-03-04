import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db, type Transaction, type TransactionType } from '../db'
import { formatCurrency, todayISO } from '../utils/format'

type TxForm = Omit<Transaction, 'id'> & { id?: number }

function txSign(type: TransactionType, amount: number) {
  if (type === 'income') return amount
  if (type === 'expense') return -amount
  return 0
}

function TxDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: (saved: boolean) => void
  initial?: TxForm
}) {
  const catalogs = useLiveQuery(async () => {
    const [accounts, categories, members] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.members.toArray(),
    ])
    return { accounts, categories, members }
  }, [])

  const [form, setForm] = useState<TxForm>(
    initial ?? {
      date: todayISO(),
      type: 'expense',
      accountId: 0,
      categoryId: 0,
      memberId: undefined,
      amount: 0,
      description: '',
      counterparty: '',
      isPlanned: false,
    },
  )

  useEffect(() => {
    if (open) {
      setForm(
        initial ?? {
          date: todayISO(),
          type: 'expense',
          accountId: 0,
          categoryId: 0,
          memberId: undefined,
          amount: 0,
          description: '',
          counterparty: '',
          isPlanned: false,
        },
      )
    }
  }, [open, initial])

  const filteredCategories = useMemo(() => {
    const cats = catalogs?.categories ?? []
    return cats.filter((c) => c.type === form.type)
  }, [catalogs?.categories, form.type])

  const canSave =
    form.date &&
    form.amount > 0 &&
    Number.isFinite(form.amount) &&
    form.accountId > 0 &&
    form.categoryId > 0

  const handleSave = async () => {
    if (!canSave) return
    const payload: Omit<Transaction, 'id'> = {
      date: form.date,
      type: form.type,
      accountId: form.accountId,
      categoryId: form.categoryId,
      memberId: form.memberId || undefined,
      amount: form.amount,
      description: form.description?.trim() || undefined,
      counterparty: form.counterparty?.trim() || undefined,
      isPlanned: !!form.isPlanned,
    }
    if (form.id != null) await db.transactions.update(form.id, payload)
    else await db.transactions.add(payload)
    onClose(true)
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="md">
      <DialogTitle>{initial ? 'Редактировать операцию' : 'Новая операция'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Дата"
              type="date"
              fullWidth
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Тип</InputLabel>
              <Select
                label="Тип"
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    type: e.target.value as TransactionType,
                    categoryId: 0,
                  }))
                }
              >
                <MenuItem value="expense">Расход</MenuItem>
                <MenuItem value="income">Доход</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Счёт</InputLabel>
              <Select
                label="Счёт"
                value={form.accountId || 0}
                onChange={(e) =>
                  setForm((p) => ({ ...p, accountId: Number(e.target.value) }))
                }
              >
                <MenuItem value={0} disabled>
                  Выберите…
                </MenuItem>
                {(catalogs?.accounts ?? []).map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Категория</InputLabel>
              <Select
                label="Категория"
                value={form.categoryId || 0}
                onChange={(e) =>
                  setForm((p) => ({ ...p, categoryId: Number(e.target.value) }))
                }
              >
                <MenuItem value={0} disabled>
                  Выберите…
                </MenuItem>
                {filteredCategories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Сумма"
              fullWidth
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((p) => ({ ...p, amount: Number(e.target.value) }))
              }
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              label="Описание"
              fullWidth
              value={form.description ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Контрагент/магазин"
              fullWidth
              value={form.counterparty ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, counterparty: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Кто</InputLabel>
              <Select
                label="Кто"
                value={form.memberId ?? 0}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    memberId: Number(e.target.value) || undefined,
                  }))
                }
              >
                <MenuItem value={0}>—</MenuItem>
                {(catalogs?.members ?? []).map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.isPlanned}
                  onChange={(e) => setForm((p) => ({ ...p, isPlanned: e.target.checked }))}
                />
              }
              label="Плановая операция (учитывать отдельно при анализе)"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Отмена</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const TransactionsPage = () => {
  const catalogs = useLiveQuery(async () => {
    const [accounts, categories, members] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.members.toArray(),
    ])
    return { accounts, categories, members }
  }, [])

  const transactions = useLiveQuery(
    async () => db.transactions.orderBy('date').reverse().toArray(),
    [],
  )

  const [type, setType] = useState<'all' | TransactionType>('all')
  const [accountId, setAccountId] = useState<number>(0)
  const [categoryId, setCategoryId] = useState<number>(0)
  const [memberId, setMemberId] = useState<number>(0)
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [q, setQ] = useState<string>('')
  const [planned, setPlanned] = useState<'all' | 'planned' | 'actual'>('all')

  const [edit, setEdit] = useState<TxForm | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const catById = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of catalogs?.categories ?? []) if (c.id != null) m.set(c.id, c.name)
    return m
  }, [catalogs?.categories])

  const accById = useMemo(() => {
    const m = new Map<number, { name: string; currency: string }>()
    for (const a of catalogs?.accounts ?? [])
      if (a.id != null) m.set(a.id, { name: a.name, currency: a.currency })
    return m
  }, [catalogs?.accounts])

  const memberById = useMemo(() => {
    const m = new Map<number, string>()
    for (const mm of catalogs?.members ?? []) if (mm.id != null) m.set(mm.id, mm.name)
    return m
  }, [catalogs?.members])

  const rows = useMemo(() => {
    const txs = transactions ?? []
    const qq = q.trim().toLowerCase()
    return txs
      .filter((t) => (type === 'all' ? true : t.type === type))
      .filter((t) => (accountId ? t.accountId === accountId : true))
      .filter((t) => (categoryId ? t.categoryId === categoryId : true))
      .filter((t) => (memberId ? t.memberId === memberId : true))
      .filter((t) => (from ? t.date >= from : true))
      .filter((t) => (to ? t.date <= to : true))
      .filter((t) => {
        if (planned === 'all') return true
        if (planned === 'planned') return !!t.isPlanned
        return !t.isPlanned
      })
      .filter((t) => {
        if (!qq) return true
        const s = `${t.description ?? ''} ${t.counterparty ?? ''}`.toLowerCase()
        return s.includes(qq)
      })
      .map((t) => {
        const acc = accById.get(t.accountId)
        const currency = acc?.currency ?? 'RUB'
        return {
          id: t.id!,
          date: t.date,
          type: t.type,
          account: acc?.name ?? `#${t.accountId}`,
          category: catById.get(t.categoryId) ?? `#${t.categoryId}`,
          member: t.memberId ? memberById.get(t.memberId) ?? `#${t.memberId}` : '—',
          planned: !!t.isPlanned,
          amountSigned: txSign(t.type, t.amount),
          amount: t.amount,
          currency,
          description: t.description ?? '',
          counterparty: t.counterparty ?? '',
          raw: t,
        }
      })
  }, [
    transactions,
    type,
    accountId,
    categoryId,
    memberId,
    from,
    to,
    q,
    planned,
    accById,
    catById,
    memberById,
  ])

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'date', headerName: 'Дата', width: 110 },
      {
        field: 'type',
        headerName: 'Тип',
        width: 110,
        renderCell: (p) =>
          p.value === 'income' ? (
            <Chip size="small" color="success" label="Доход" />
          ) : (
            <Chip size="small" color="error" label="Расход" />
          ),
      },
      { field: 'account', headerName: 'Счёт', width: 170 },
      { field: 'category', headerName: 'Категория', width: 200 },
      { field: 'member', headerName: 'Кто', width: 140 },
      {
        field: 'planned',
        headerName: 'План',
        width: 85,
        renderCell: (p) => (p.value ? <Chip size="small" label="Да" /> : <span />),
      },
      {
        field: 'amountSigned',
        headerName: 'Сумма',
        width: 140,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (_v, row) => formatCurrency(row.amountSigned, row.currency),
      },
      { field: 'counterparty', headerName: 'Контрагент', width: 200 },
      { field: 'description', headerName: 'Описание', flex: 1, minWidth: 220 },
      {
        field: 'actions',
        headerName: '',
        width: 70,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Tooltip title="Редактировать">
            <IconButton
              size="small"
              onClick={() => {
                setEdit(p.row.raw as Transaction)
                setIsDialogOpen(true)
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [],
  )

  const total = useMemo(() => {
    return rows.reduce((sum, r) => sum + r.amountSigned, 0)
  }, [rows])

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="start">
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={600}>
            Операции
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь вы ведёте ежедневные доходы и расходы семьи, с удобными фильтрами по датам, счетам, категориям и
            участникам.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEdit(undefined)
            setIsDialogOpen(true)
          }}
          className="no-print"
        >
          Добавить
        </Button>
      </Stack>

      <Paper elevation={3} sx={{ p: 2 }} className="no-print">
        <Grid container spacing={2}>
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Счёт</InputLabel>
              <Select
                label="Счёт"
                value={accountId}
                onChange={(e) => setAccountId(Number(e.target.value))}
              >
                <MenuItem value={0}>Все</MenuItem>
                {(catalogs?.accounts ?? []).map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Категория</InputLabel>
              <Select
                label="Категория"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
              >
                <MenuItem value={0}>Все</MenuItem>
                {(catalogs?.categories ?? [])
                  .filter((c) => (type === 'all' ? true : c.type === type))
                  .map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Кто</InputLabel>
              <Select
                label="Кто"
                value={memberId}
                onChange={(e) => setMemberId(Number(e.target.value))}
              >
                <MenuItem value={0}>Все</MenuItem>
                {(catalogs?.members ?? []).map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>План</InputLabel>
              <Select
                label="План"
                value={planned}
                onChange={(e) => setPlanned(e.target.value as 'all' | 'planned' | 'actual')}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="actual">Факт</MenuItem>
                <MenuItem value="planned">План</MenuItem>
              </Select>
            </FormControl>
          </Grid>
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
          <Grid item xs={12}>
            <TextField
              label="Поиск (описание/контрагент)"
              fullWidth
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ height: 560 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
          }}
        />
      </Paper>

      <Paper elevation={0} sx={{ p: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Итог по выборке: <b>{formatCurrency(total)}</b>
        </Typography>
      </Paper>

      <TxDialog
        open={isDialogOpen}
        initial={edit}
        onClose={() => {
          setIsDialogOpen(false)
          setEdit(undefined)
        }}
      />
    </Stack>
  )
}

export default TransactionsPage

