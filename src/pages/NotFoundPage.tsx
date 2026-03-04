import { Button, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
  const navigate = useNavigate()
  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={600}>
        Страница не найдена
      </Typography>
      <Typography color="text.secondary">
        Такой страницы нет. Вернитесь на главную.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        На главную
      </Button>
    </Stack>
  )
}

export default NotFoundPage

