import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db, type Account, type Category, type FamilyMember } from '../db'
import { deleteAccountCascade, deleteCategoryCascade } from '../services/cascade'
import { formatCurrency } from '../utils/format'

type CatForm = Omit<Category, 'id'> & { id?: number }
type AccForm = Omit<Account, 'id'> & { id?: number }
type MemberForm = Omit<FamilyMember, 'id'> & { id?: number }

function CategoryDialog({
  open,
  onClose,
  initial,
  parentPrefill,
}: {
  open: boolean
  onClose: (saved: boolean) => void
  initial?: CatForm
  parentPrefill?: number | null
}) {
  const categories = useLiveQuery(async () => db.categories.toArray(), [])
  const [form, setForm] = useState<CatForm>(
    initial ?? { name: '', type: 'expense', parentId: parentPrefill ?? null },
  )

  useEffect(() => {
    if (!open) return
    setForm(
      initial ?? { name: '', type: 'expense', parentId: parentPrefill ?? null },
    )
  }, [open, initial, parentPrefill])

  const parentOptions = useMemo(() => {
    const cats = categories ?? []
    return cats.filter((c) => c.type === form.type && c.id !== form.id)
  }, [categories, form.type, form.id])

  const canSave = form.name.trim().length >= 2

  const handleSave = async () => {
    if (!canSave) return
    const payload: Omit<Category, 'id'> = {
      name: form.name.trim(),
      type: form.type,
      parentId: form.parentId ?? null,
    }
    if (form.id != null) await db.categories.update(form.id, payload)
    else await db.categories.add(payload)
    onClose(true)
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Категория: редактирование' : 'Категория: добавление'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0 }}>
          <TextField
            label="Название"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Тип</InputLabel>
                <Select
                  label="Тип"
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      type: e.target.value as Category['type'],
                      parentId: null,
                    }))
                  }
                >
                  <MenuItem value="expense">Расход</MenuItem>
                  <MenuItem value="income">Доход</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Родитель</InputLabel>
                <Select
                  label="Родитель"
                  value={form.parentId ?? 0}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      parentId: Number(e.target.value) || null,
                    }))
                  }
                >
                  <MenuItem value={0}>Без родителя</MenuItem>
                  {parentOptions.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Stack>
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

function AccountDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: (saved: boolean) => void
  initial?: AccForm
}) {
  const [form, setForm] = useState<AccForm>(
    initial ?? { name: '', type: 'card', currency: 'RUB', initialBalance: 0 },
  )

  useEffect(() => {
    if (!open) return
    setForm(initial ?? { name: '', type: 'card', currency: 'RUB', initialBalance: 0 })
  }, [open, initial])

  const canSave = form.name.trim().length >= 2 && form.currency.trim().length >= 3

  const handleSave = async () => {
    if (!canSave) return
    const payload: Omit<Account, 'id'> = {
      name: form.name.trim(),
      type: form.type,
      currency: form.currency.trim().toUpperCase(),
      initialBalance: Number(form.initialBalance) || 0,
      ownerId: form.ownerId,
    }
    if (form.id != null) await db.accounts.update(form.id, payload)
    else await db.accounts.add(payload)
    onClose(true)
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Счёт: редактирование' : 'Счёт: добавление'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0 }}>
          <TextField
            label="Название"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Тип</InputLabel>
                <Select
                  label="Тип"
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, type: e.target.value as Account['type'] }))
                  }
                >
                  <MenuItem value="cash">Наличные</MenuItem>
                  <MenuItem value="card">Карта</MenuItem>
                  <MenuItem value="deposit">Вклад</MenuItem>
                  <MenuItem value="other">Другое</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Валюта (ISO)"
                fullWidth
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
              />
            </Grid>
          </Grid>
          <TextField
            label="Начальный остаток"
            fullWidth
            type="number"
            value={form.initialBalance}
            onChange={(e) => setForm((p) => ({ ...p, initialBalance: Number(e.target.value) }))}
          />
        </Stack>
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

function MemberDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: (saved: boolean) => void
  initial?: MemberForm
}) {
  const [form, setForm] = useState<MemberForm>(initial ?? { name: '', role: '' })

  useEffect(() => {
    if (!open) return
    setForm(initial ?? { name: '', role: '' })
  }, [open, initial])

  const canSave = form.name.trim().length >= 2

  const handleSave = async () => {
    if (!canSave) return
    const payload: Omit<FamilyMember, 'id'> = {
      name: form.name.trim(),
      role: form.role.trim(),
    }
    if (form.id != null) await db.members.update(form.id, payload)
    else await db.members.add(payload)
    onClose(true)
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Член семьи: редактирование' : 'Член семьи: добавление'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0 }}>
          <TextField
            label="Имя"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <TextField
            label="Роль (необязательно)"
            fullWidth
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          />
        </Stack>
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

const CategoriesPage = () => {
  const [tab, setTab] = useState(0)
  const catalogs = useLiveQuery(async () => {
    const [categories, accounts, members, txs] = await Promise.all([
      db.categories.toArray(),
      db.accounts.toArray(),
      db.members.toArray(),
      db.transactions.toArray(),
    ])
    return { categories, accounts, members, txs }
  }, [])

  const [q, setQ] = useState('')

  const catById = useMemo(() => {
    const m = new Map<number, Category>()
    for (const c of catalogs?.categories ?? []) if (c.id != null) m.set(c.id, c)
    return m
  }, [catalogs?.categories])

  const catRows = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return (catalogs?.categories ?? [])
      .filter((c) => (qq ? c.name.toLowerCase().includes(qq) : true))
      .map((c) => ({
        id: c.id!,
        name: c.name,
        type: c.type,
        parent: c.parentId ? catById.get(c.parentId)?.name ?? `#${c.parentId}` : '—',
        raw: c,
      }))
  }, [catalogs?.categories, q, catById])

  const accRows = useMemo(() => {
    const txCountByAcc = new Map<number, number>()
    for (const t of catalogs?.txs ?? []) {
      txCountByAcc.set(t.accountId, (txCountByAcc.get(t.accountId) ?? 0) + 1)
    }
    return (catalogs?.accounts ?? []).map((a) => ({
      id: a.id!,
      name: a.name,
      type: a.type,
      currency: a.currency,
      initialBalance: formatCurrency(a.initialBalance, a.currency),
      txCount: txCountByAcc.get(a.id!) ?? 0,
      raw: a,
    }))
  }, [catalogs?.accounts, catalogs?.txs])

  const memberRows = useMemo(() => {
    return (catalogs?.members ?? []).map((m) => ({
      id: m.id!,
      name: m.name,
      role: m.role,
      raw: m,
    }))
  }, [catalogs?.members])

  const [catDlg, setCatDlg] = useState<{ open: boolean; edit?: CatForm; parentPrefill?: number | null }>({
    open: false,
  })
  const [accDlg, setAccDlg] = useState<{ open: boolean; edit?: AccForm }>({ open: false })
  const [memDlg, setMemDlg] = useState<{ open: boolean; edit?: MemberForm }>({ open: false })

  const catColumns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Название', flex: 1, minWidth: 200 },
      {
        field: 'type',
        headerName: 'Тип',
        width: 110,
        valueGetter: (_v, row) => (row.type === 'income' ? 'Доход' : 'Расход'),
      },
      { field: 'parent', headerName: 'Родитель', width: 200 },
      {
        field: 'actions',
        headerName: '',
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Добавить подкатегорию">
              <IconButton
                size="small"
                onClick={() => setCatDlg({ open: true, edit: undefined, parentPrefill: (p.row.raw as Category).id! })}
              >
                <SubdirectoryArrowRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Редактировать">
              <IconButton
                size="small"
                onClick={() => setCatDlg({ open: true, edit: p.row.raw as Category })}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить (каскадно)">
              <IconButton
                size="small"
                color="error"
                onClick={async () => {
                  const c = p.row.raw as Category
                  if (confirm(`Удалить категорию "${c.name}" вместе с подкатегориями и связанными данными?`)) {
                    await deleteCategoryCascade(c.id!)
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
  )

  const accColumns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Название', flex: 1, minWidth: 180 },
      { field: 'type', headerName: 'Тип', width: 130 },
      { field: 'currency', headerName: 'Валюта', width: 90 },
      { field: 'initialBalance', headerName: 'Старт', width: 140 },
      { field: 'txCount', headerName: 'Операций', width: 110 },
      {
        field: 'actions',
        headerName: '',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Редактировать">
              <IconButton
                size="small"
                onClick={() => setAccDlg({ open: true, edit: p.row.raw as Account })}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить (каскадно)">
              <IconButton
                size="small"
                color="error"
                onClick={async () => {
                  const a = p.row.raw as Account
                  if (
                    confirm(
                      `Удалить счёт "${a.name}" и все связанные операции?`,
                    )
                  ) {
                    await deleteAccountCascade(a.id!)
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
  )

  const memberColumns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Имя', flex: 1, minWidth: 200 },
      { field: 'role', headerName: 'Роль', width: 200 },
      {
        field: 'actions',
        headerName: '',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Редактировать">
              <IconButton
                size="small"
                onClick={() => setMemDlg({ open: true, edit: p.row.raw as FamilyMember })}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton
                size="small"
                color="error"
                onClick={async () => {
                  const m = p.row.raw as FamilyMember
                  if (confirm(`Удалить "${m.name}"?`)) await db.members.delete(m.id!)
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
  )

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={600}>
          Каталоги
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Здесь настраиваются категории расходов и доходов, семейные счета и список членов семьи.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 1 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Категории" />
          <Tab label="Счета" />
          <Tab label="Члены семьи" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
            <TextField
              label="Поиск по названию"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCatDlg({ open: true })}
            >
              Добавить
            </Button>
          </Stack>
          <Paper elevation={3} sx={{ height: 560 }}>
            <DataGrid
              rows={catRows}
              columns={catColumns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            />
          </Paper>
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAccDlg({ open: true })}
            >
              Добавить
            </Button>
          </Stack>
          <Paper elevation={3} sx={{ height: 560 }}>
            <DataGrid
              rows={accRows}
              columns={accColumns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            />
          </Paper>
        </Stack>
      )}

      {tab === 2 && (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setMemDlg({ open: true })}
            >
              Добавить
            </Button>
          </Stack>
          <Paper elevation={3} sx={{ height: 560 }}>
            <DataGrid
              rows={memberRows}
              columns={memberColumns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            />
          </Paper>
        </Stack>
      )}

      <CategoryDialog
        open={catDlg.open}
        initial={catDlg.edit}
        parentPrefill={catDlg.parentPrefill}
        onClose={() => setCatDlg({ open: false })}
      />
      <AccountDialog
        open={accDlg.open}
        initial={accDlg.edit}
        onClose={() => setAccDlg({ open: false })}
      />
      <MemberDialog
        open={memDlg.open}
        initial={memDlg.edit}
        onClose={() => setMemDlg({ open: false })}
      />
    </Stack>
  )
}

export default CategoriesPage

