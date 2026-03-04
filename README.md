# Семейное финансовое планирование (без авторизации)

Веб‑приложение для домашнего учета и планирования: операции, категории/счета, бюджеты и цели, отчеты с печатью.  
Данные хранятся **локально в приложении** (IndexedDB), без сервера.

## Возможности

- **Операции**: добавление/редактирование/удаление, фильтры по датам, типу, счету, категории, члену семьи, план/факт, поиск по тексту
- **Каталоги**: категории (включая подкатегории), счета, члены семьи
  - удаление категории/счета — **каскадное** (удаляются связанные операции/бюджеты/цели)
  - добавление подкатегорий (каскадное добавление через кнопку «подкатегория»)
- **Бюджеты**: лимиты по категориям на месяц + прогресс
- **Цели**: накопления с прогрессом
- **Отчеты**: агрегация по категориям/счетам, **печать**, экспорт/импорт бэкапа JSON, очистка данных

## Технологии

- React + TypeScript + Vite
- UI: MUI (Material UI)
- Локальная БД: IndexedDB через Dexie

## Запуск

```bash
npm install
npm run dev
```

Откройте адрес из консоли (обычно `http://localhost:5173`).

## Сборка для релиза

```bash
npm run build
npm run preview
```

## Где лежат данные

Данные сохраняются в **IndexedDB** браузера (БД `familyFinanceDB`).  
Для переноса между устройствами используйте **Экспорт/Импорт** на странице «Отчёты и печать».

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
