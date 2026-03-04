import {
  AccountBalance,
  Assessment,
  Category as CategoryIcon,
  Dashboard as DashboardIcon,
  ListAlt,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  createTheme,
  ThemeProvider,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import CategoriesPage from './pages/CategoriesPage'
import BudgetsPage from './pages/BudgetsPage'
import ReportsPage from './pages/ReportsPage'
import { useEffect } from 'react'
import { seedIfEmpty } from './seed'
import NotFoundPage from './pages/NotFoundPage'
import SavingsIcon from '@mui/icons-material/Savings'

const drawerWidth = 260

type ThemeColor = 'purple' | 'blue' | 'teal'

interface NavItem {
  label: string
  path: string
  icon: React.ReactElement
}

const navItems: NavItem[] = [
  { label: 'Обзор', path: '/', icon: <DashboardIcon /> },
  { label: 'Операции', path: '/transactions', icon: <ListAlt /> },
  { label: 'Категории и счета', path: '/catalogs', icon: <CategoryIcon /> },
  { label: 'Бюджеты и цели', path: '/budgets', icon: <AccountBalance /> },
  { label: 'Отчёты и печать', path: '/reports', icon: <Assessment /> },
]

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const saved = window.localStorage.getItem('family-finance-theme') as ThemeColor | null
    return saved ?? 'purple'
  })
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    void seedIfEmpty()
  }, [])

  useEffect(() => {
    window.localStorage.setItem('family-finance-theme', themeColor)
  }, [themeColor])

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary:
        themeColor === 'purple'
          ? { main: '#7b1fa2' }
          : themeColor === 'blue'
            ? { main: '#1565c0' }
            : { main: '#00897b' },
      secondary:
        themeColor === 'purple'
          ? { main: '#ff4081' }
          : themeColor === 'blue'
            ? { main: '#ffb300' }
            : { main: '#ff7043' },
      background: {
        default:
          themeColor === 'purple'
            ? '#f5f0ff'
            : themeColor === 'blue'
              ? '#f3f6fb'
              : '#e8f5e9',
      },
    },
    shape: {
      borderRadius: 12,
    },
  })

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev)
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Семейный бюджет
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }} className="no-print">
        <List dense disablePadding sx={{ mb: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/budgets?tab=goals')
                setMobileOpen(false)
              }}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SavingsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Цели"
                secondary="Быстрый доступ"
              />
            </ListItemButton>
          </ListItem>
        </List>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Цвет темы:
        </Typography>
        <Stack direction="row" spacing={1}>
          <Box
            onClick={() => setThemeColor('purple')}
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: '#7b1fa2',
              border: themeColor === 'purple' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
            }}
          />
          <Box
            onClick={() => setThemeColor('blue')}
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: '#1565c0',
              border: themeColor === 'blue' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
            }}
          />
          <Box
            onClick={() => setThemeColor('teal')}
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: '#00897b',
              border: themeColor === 'teal' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
            }}
          />
        </Stack>
      </Box>
    </Box>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        className="no-print"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background:
            themeColor === 'purple'
              ? 'linear-gradient(90deg, #6a1b9a, #ab47bc)'
              : themeColor === 'blue'
                ? 'linear-gradient(90deg, #1565c0, #42a5f5)'
                : 'linear-gradient(90deg, #00695c, #26a69a)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Семейное финансовое планирование
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        className="no-print"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="меню"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background:
            themeColor === 'purple'
              ? 'radial-gradient(circle at top left, #f3e5f5, #faf5ff 40%, #ede7f6)'
              : themeColor === 'blue'
                ? 'radial-gradient(circle at top left, #e3f2fd, #fafafa 40%, #e8eaf6)'
                : 'radial-gradient(circle at top left, #e0f2f1, #f1f8e9 40%, #e8f5e9)',
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/catalogs" element={<CategoriesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </Box>
    </ThemeProvider>
  )
}

export default App
