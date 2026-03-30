import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SavingsIcon from '@mui/icons-material/Savings'
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
  LinearProgress,
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
import { useLocation } from 'react-router-dom'
import { db, type Budget, type Goal } from '../db'
import { formatCurrency, monthKey, todayISO } from '../utils/format'

type BudgetForm = Omit<Budget, 'id'> & { id?: number }
type GoalForm = Omit<Goal, 'id'> & { id?: number }

interface GoalProgressForm {
  id: number
  name: string
  currentAmount: number
  delta: number
}

function BudgetDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: (saved: boolean) => void
  initial?: BudgetForm
}) {
  const categories = useLiveQuery(
    async () => db.categories.where('type').equals('expense').toArray(),
    [],
  )
  const [form, setForm] = useState<BudgetForm>(initial ?? { categoryId: 0, amountPerMonth: 0 })

  useEffect(() => {
    if (!open) return
    setForm(initial ?? { categoryId: 0, amountPerMonth: 0 })
  }, [open, initial])

  const canSave = form.categoryId > 0 && form.amountPerMonth > 0

  const handleSave = async () => {
    if (!canSave) return
    const payload: Omit<Budget, 'id'> = {
      categoryId: form.categoryId,
      amountPerMonth: Number(form.amountPerMonth) || 0,
    }
    if (form.id != null) await db.budgets.update(form.id, payload)
    else await db.budgets.add(payload)
    onClose(true)
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Бюджет: редактирование' : 'Бюджет: добавление'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Категория</InputLabel>
            <Select
              label="Категория"
              value={form.categoryId}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: Number(e.target.value) }))}
            >
              <MenuItem value={0} disabled>
                Выберите…
              </MenuItem>
              {(categories ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Лимит в месяц"
            type="number"
            value={form.amountPerMonth}
            onChange={(e) => setForm((p) => ({ ...p, amountPerMonth: Number(e.target.value) }))}
            inputProps={{ min: 0, step: 1 }}
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

function GoalDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: (saved: boolean) => void
  initial?: GoalForm
}) {
  const categories = useLiveQuery(async () => db.categories.toArray(), [])
  const [form, setForm] = useState<GoalForm>(
    initial ?? { name: '', targetAmount: 0, currentAmount: 0, dueDate: '', categoryId: undefined },
  )

  useEffect(() => {
    if (!open) return
    setForm(
      initial ?? { name: '', targetAmount: 0, currentAmount: 0, dueDate: '', categoryId: undefined },
    )
  }, [open, initial])

  const canSave = form.name.trim().length >= 2 && form.targetAmount > 0

  const handleSave = async () => {
    if (!canSave) return
    const payload: Omit<Goal, 'id'> = {
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount) || 0,
      currentAmount: Number(form.currentAmount) || 0,
      dueDate: form.dueDate?.trim() || undefined,
      categoryId: form.categoryId || undefined,
    }
    if (form.id != null) await db.goals.update(form.id, payload)
    else await db.goals.add(payload)
    onClose(true)
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Цель: редактирование' : 'Цель: добавление'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Название"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Целевая сумма"
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm((p) => ({ ...p, targetAmount: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Накоплено"
                type="number"
                value={form.currentAmount}
                onChange={(e) => setForm((p) => ({ ...p, currentAmount: Number(e.target.value) }))}
              />
            </Grid>
          </Grid>
          <TextField
            label="Срок (необязательно)"
            type="date"
            value={form.dueDate ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth>
            <InputLabel>Категория (необязательно)</InputLabel>
            <Select
              label="Категория (необязательно)"
              value={form.categoryId ?? 0}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: Number(e.target.value) || undefined }))}
            >
              <MenuItem value={0}>—</MenuItem>
              {(categories ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

const BudgetsPage = () => {
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const [month, setMonth] = useState(monthKey(todayISO()))

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('tab')
    if (t === 'goals') setTab(1)
    if (t === 'budgets') setTab(0)
  }, [location.search])

  const data = useLiveQuery(async () => {
    const [categories, budgets, goals, txs] = await Promise.all([
      db.categories.toArray(),
      db.budgets.toArray(),
      db.goals.toArray(),
      db.transactions.toArray(),
    ])
    return { categories, budgets, goals, txs }
  }, [])

  const catNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of data?.categories ?? []) if (c.id != null) m.set(c.id, c.name)
    return m
  }, [data?.categories])

  const spentByCategory = useMemo(() => {
    const m = new Map<number, number>()
    for (const t of data?.txs ?? []) {
      if (t.type !== 'expense') continue
      if (t.isPlanned) continue
      if (!t.date.startsWith(month)) continue
      m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + t.amount)
    }
    return m
  }, [data?.txs, month])

  const budgetRows = useMemo(() => {
    return (data?.budgets ?? []).map((b) => {
      const spent = spentByCategory.get(b.categoryId) ?? 0
      const pctRaw = b.amountPerMonth > 0 ? (spent / b.amountPerMonth) * 100 : 0
      const pct = Math.min(100, Math.round(pctRaw))
      return {
        id: b.id!,
        category: catNameById.get(b.categoryId) ?? `#${b.categoryId}`,
        amountPerMonth: formatCurrency(b.amountPerMonth),
        spent: formatCurrency(spent),
        pct,
        rawPct: pctRaw,
        raw: b,
      }
    })
  }, [data?.budgets, spentByCategory, catNameById])

  const goalRows = useMemo(() => {
    return (data?.goals ?? []).map((g) => {
      const pctRaw = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
      const pct = Math.min(100, Math.round(pctRaw))
      return {
        id: g.id!,
        name: g.name,
        target: formatCurrency(g.targetAmount),
        current: formatCurrency(g.currentAmount),
        dueDate: g.dueDate ?? '—',
        category: g.categoryId ? catNameById.get(g.categoryId) ?? `#${g.categoryId}` : '—',
        pct,
        rawPct: pctRaw,
        raw: g,
      }
    })
  }, [data?.goals, catNameById])

  const [budgetDlg, setBudgetDlg] = useState<{ open: boolean; edit?: BudgetForm }>({ open: false })
  const [goalDlg, setGoalDlg] = useState<{ open: boolean; edit?: GoalForm }>({ open: false })
  const [goalProgressDlg, setGoalProgressDlg] = useState<{ open: boolean; form?: GoalProgressForm }>({
    open: false,
  })

  const budgetColumns = useMemo<GridColDef[]>(
    () => [
      { field: 'category', headerName: 'Категория', flex: 1, minWidth: 220 },
      { field: 'amountPerMonth', headerName: 'Лимит', width: 140 },
      { field: 'spent', headerName: 'Потрачено', width: 140 },
      {
        field: 'pct',
        headerName: 'Использовано',
        width: 200,
        renderCell: (p) => (
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={Number(p.value) || 0}
              sx={{
                height: 10,
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    (p.row as any).rawPct >= 90 ? '#d32f2f' : (p.row as any).rawPct >= 70 ? '#ed6c02' : '#2e7d32',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {p.value}%
            </Typography>
          </Box>
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Редактировать">
              <IconButton size="small" onClick={() => setBudgetDlg({ open: true, edit: p.row.raw as Budget })}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton
                size="small"
                color="error"
                onClick={async () => {
                  const b = p.row.raw as Budget
                  if (confirm('Удалить бюджет?')) await db.budgets.delete(b.id!)
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

  const goalColumns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Цель', flex: 1, minWidth: 220 },
      { field: 'category', headerName: 'Категория', width: 200 },
      { field: 'current', headerName: 'Накоплено', width: 140 },
      { field: 'target', headerName: 'Цель', width: 140 },
      { field: 'dueDate', headerName: 'Срок', width: 120 },
      {
        field: 'pct',
        headerName: 'Прогресс',
        width: 200,
        renderCell: (p) => (
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={Number(p.value) || 0}
              sx={{
                height: 10,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: (p.row as any).rawPct >= 100 ? '#2e7d32' : (p.row as any).rawPct >= 60 ? '#ed6c02' : '#7b1fa2',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {p.value}%
            </Typography>
          </Box>
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 150,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Отметить пополнение">
              <IconButton
                size="small"
                color="primary"
                onClick={() =>
                  setGoalProgressDlg({
                    open: true,
                    form: {
                      id: (p.row.raw as Goal).id!,
                      name: (p.row.raw as Goal).name,
                      currentAmount: (p.row.raw as Goal).currentAmount,
                      delta: 0,
                    },
                  })
                }
              >
                <SavingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Редактировать">
              <IconButton size="small" onClick={() => setGoalDlg({ open: true, edit: p.row.raw as Goal })}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton
                size="small"
                color="error"
                onClick={async () => {
                  const g = p.row.raw as Goal
                  if (confirm('Удалить цель?')) await db.goals.delete(g.id!)
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
          Бюджеты и цели
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Здесь вы задаёте месячные лимиты по статьям расходов и отслеживаете прогресс по вашим финансовым целям.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 1 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Бюджеты" />
          <Tab label="Цели" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
            <TextField
              label="Месяц"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBudgetDlg({ open: true })}>
              Добавить
            </Button>
          </Stack>
          <Paper elevation={3} sx={{ height: 560 }}>
            <DataGrid
              rows={budgetRows}
              columns={budgetColumns}
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setGoalDlg({ open: true })}>
              Добавить
            </Button>
          </Stack>
          <Paper elevation={3} sx={{ height: 560 }}>
            <DataGrid
              rows={goalRows}
              columns={goalColumns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            />
          </Paper>
        </Stack>
      )}

      <BudgetDialog open={budgetDlg.open} initial={budgetDlg.edit} onClose={() => setBudgetDlg({ open: false })} />
      <GoalDialog open={goalDlg.open} initial={goalDlg.edit} onClose={() => setGoalDlg({ open: false })} />
      <Dialog
        open={goalProgressDlg.open}
        onClose={() => setGoalProgressDlg({ open: false })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Пополнение цели</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Цель: <b>{goalProgressDlg.form?.name}</b>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Уже накоплено: <b>{formatCurrency(goalProgressDlg.form?.currentAmount ?? 0)}</b>
            </Typography>
            <TextField
              label="Сумма пополнения"
              type="number"
              value={goalProgressDlg.form?.delta ?? 0}
              onChange={(e) =>
                setGoalProgressDlg((prev) =>
                  prev.form
                    ? {
                        open: true,
                        form: { ...prev.form, delta: Number(e.target.value) || 0 },
                      }
                    : prev,
                )
              }
              inputProps={{ min: 0, step: 1 }}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {[500, 1000, 1500, 2000, 5000].map((amt) => (
                <Button
                  key={amt}
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setGoalProgressDlg((prev) =>
                      prev.form
                        ? {
                            open: true,
                            form: { ...prev.form, delta: amt },
                          }
                        : prev,
                    )
                  }
                >
                  {amt} ₽
                </Button>
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalProgressDlg({ open: false })}>Отмена</Button>
          <Button
            variant="contained"
            disabled={!goalProgressDlg.form || goalProgressDlg.form.delta <= 0}
            onClick={async () => {
              if (!goalProgressDlg.form) return
              const { id, currentAmount, delta } = goalProgressDlg.form
              await db.goals.update(id, { currentAmount: currentAmount + delta })
              setGoalProgressDlg({ open: false })
            }}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default BudgetsPage

