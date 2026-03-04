import { Paper, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

function formatCurrency(value: number, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

const DashboardPage = () => {
  const summary = useLiveQuery(async () => {
    const [accounts, transactions] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.toArray(),
    ])

    const totalBalance =
      accounts.reduce((sum, a) => sum + a.initialBalance, 0) +
      transactions.reduce((sum, t) => {
        if (t.type === 'income') return sum + t.amount
        if (t.type === 'expense') return sum - t.amount
        return sum
      }, 0)

    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const monthly = transactions.filter((t) => t.date.startsWith(monthKey))
    const income = monthly
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = monthly
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      totalBalance,
      monthIncome: income,
      monthExpense: expense,
      monthDelta: income - expense,
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
    }
  }, [])

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={600}>
        Обзор семьи
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Здесь вы видите общий баланс семьи и итоги текущего месяца по доходам и расходам.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Текущий баланс
            </Typography>
            <Typography variant="h5">
              {summary ? formatCurrency(summary.totalBalance) : '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Доход за месяц
            </Typography>
            <Typography color="success.main" variant="h6">
              {summary ? formatCurrency(summary.monthIncome) : '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Расход за месяц
            </Typography>
            <Typography color="error.main" variant="h6">
              {summary ? formatCurrency(summary.monthExpense) : '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Итог месяца
            </Typography>
            <Typography
              variant="h6"
              color={summary && summary.monthDelta >= 0 ? 'success.main' : 'error.main'}
            >
              {summary ? formatCurrency(summary.monthDelta) : '—'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default DashboardPage

