# 🌌 SolQuest — Unified Solana Web3 Ecosystem (Weeks 3–8)

**SolQuest** — это единый Web3 MVP проект на экосистеме Solana, объединяющий все практические задания с **3-й по 8-ю неделю** тематического плана в одну целостную рабочую систему:
- **Rust CLI утилита** для разработчика (Неделя 3)
- **Solana Program на Anchor**, готовая к деплою в Devnet (Недели 4 & 5)
- **On-chain Counter & XP Logic** (Неделя 5)
- **Децентрализованные профили на PDA** (Неделя 6)
- **Выпуск собственного SPL токена $QUEST, CPI-минт, трансфер и метаданные** (Неделя 7)
- **Полноценный Web3 MVP дашборд на React/Vite + Wallet Adapter** (Неделя 8)

---

## 🗺️ Соответствие тематическому плану (Недели 3–8)

| Неделя | Тема силлабуса | Реализация в проекте SolQuest | Расположение в коде |
| :--- | :--- | :--- | :--- |
| **3** | **Rust для Solana-разработчика**<br>CLI-программа с конструкциями Solana | Полноценная CLI-утилита на Rust (`solquest-cli`) с парсером `clap`, сериализацией **Borsh**, расчётом PDA math off-chain, генератором транзакций и RPC клиентом. | `crates/solquest-cli/` |
| **4** | **Первая Solana Program**<br>Деплой программы в Devnet | Смарт-контракт на фреймворке Anchor, скрипты автоматического деплоя в Solana Devnet, конфигурация кластера. | `programs/solquest/`<br>`scripts/deploy-devnet.ps1` |
| **5** | **Anchor Framework**<br>Counter Program + client interaction | Модуль счётчика активности (`counter`) с начислением XP, повышением уровней пользователя и фиксацией в блокчейне. | `programs/solquest/src/instructions/increment_counter.rs` |
| **6** | **Accounts, PDAs и архитектура**<br>On-chain профиль с PDA | Децентрализованный профиль пользователя `UserProfile`, деривация PDA по сидам `["user-profile", authority]`, проверка bump seed и арендной платы (Rent Exemption). | `programs/solquest/src/state/profile.rs`<br>`programs/solquest/src/instructions/init_profile.rs` |
| **7** | **SPL Tokens и Extensions**<br>Выпуск, transfer, metadata | Создание SPL-токена `$QUEST`, выпуск наград пользователям через CPI (`mint_to`) с правами PDA-минтера (`mint-authority`), переводы токенов и метаданные Metaplex. | `programs/solquest/src/instructions/claim_reward.rs`<br>`programs/solquest/src/instructions/transfer_reward.rs`<br>`scripts/setup-devnet.ts` |
| **8** | **PK1: BUILD SPRINT**<br>Первый Web3 MVP | Интерактивный веб-дашборд (React, Vite, Tailwind, Solana Wallet Adapter), связывающий все компоненты в единый хакатон-прототип. | `app/` |

---

## 🏛️ Архитектура системы

```
                              ┌───────────────────────────────────┐
                              │     User Wallet (Phantom / CLI)   │
                              └─────────────────┬─────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
     [Rust CLI: crates/solquest-cli]                               [Web3 MVP: app/ (React/Vite)]
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                │ (RPC: Devnet)
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SolQuest Smart Contract (Anchor)                                 │
│                                                                                             │
│   ┌────────────────────────────────┐                 ┌──────────────────────────────────┐   │
│   │   ProgramConfig (PDA)          │                 │      UserProfile (PDA)           │   │
│   │   Seeds: ["solquest-config"]   │                 │   Seeds: ["user-profile", user]  │   │
│   │   • admin: Pubkey              │                 │   • username & bio (String)      │   │
│   │   • reward_mint: Pubkey        │                 │   • counter: u64  (Week 5)       │   │
│   │   • total_profiles / count     │                 │   • xp & level    (Week 6)       │   │
│   └────────────────────────────────┘                 │   • tokens_claimed: u64          │   │
│                   │                                  └─────────────────┬────────────────┘   │
│                   │                                                    │                    │
│                   │ (CPI Signer with PDA seeds)                        │ (Eligibility check)│
│                   ▼                                                    ▼                    │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                               SPL Token Program (CPI)                               │   │
│   │   • Minting reward tokens ($QUEST) to user's Associated Token Account (ATA)         │   │
│   │   • Transfer tokens between users                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Структура проекта

```
solana/
├── Anchor.toml                     # Настройки Anchor (Devnet & Localnet)
├── Cargo.toml                      # Корневой воркспейс Rust
├── package.json                    # Скрипты тестирования и сборки
├── tsconfig.json                   # Настройки TypeScript
│
├── programs/solquest/              # Смарт-контракт на Rust / Anchor (Недели 4–7)
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs                  # Точка входа программы и диспетчер
│       ├── errors.rs               # Кастомные коды ошибок
│       ├── state/
│       │   ├── profile.rs          # Модель аккаунта UserProfile (PDA)
│       │   └── config.rs           # Глобальный конфиг протокола
│       └── instructions/
│           ├── initialize_config.rs# Настройка параметров протокола
│           ├── init_profile.rs     # Создание on-chain профиля (Week 6)
│           ├── increment_counter.rs# Инкремент счётчика и XP (Week 5)
│           ├── claim_reward.rs     # Выпуск токенов $QUEST через CPI (Week 7)
│           └── transfer_reward.rs  # Трансфер SPL токенов (Week 7)
│
├── crates/solquest-cli/            # CLI-утилита на Rust (Неделя 3)
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs                 # Парсер аргументов командной строки (Clap)
│       ├── commands.rs             # Обработчики команд и транзакций
│       ├── solana_utils.rs         # Математика PDA, SHA256 дискриминаторы, RPC
│       └── types.rs                # Сериализация Borsh структур данных
│
├── app/                            # Web3 MVP Дашборд (Неделя 8)
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx                 # Главный дашборд со всеми виджетами
│       ├── components/
│       │   ├── Navbar.tsx          # Подключение кошелька
│       │   ├── ProfileCard.tsx     # Профиль, опыт, уровень и PDA
│       │   ├── CounterSection.tsx  # Живой счётчик активности
│       │   ├── TokenSection.tsx    # Баланс $QUEST, клейм и перевод
│       │   └── PdaExplorer.tsx     # Разбор математики деривации сидов
│       └── hooks/
│           └── useSolQuest.ts      # Реактивный хук для работы с блокчейном
│
├── tests/
│   └── solquest.ts                 # Интеграционные тесты Mocha/Chai (Недели 4–7)
│
└── scripts/
    ├── setup-devnet.ts             # Создание токена, Metaplex метаданных и конфига
    └── deploy-devnet.ps1           # Автоматический скрипт сборки и деплоя
```

---

## 🚀 Быстрый старт и запуск

### 1. Запуск Rust CLI (Неделя 3)
Утилита демонстрирует работу с Solana SDK, подсчёт адресов PDA и сериализацию Borsh:

```powershell
# Показать справку по всем командам
cargo run --bin solquest-cli -- --help

# 1. Сгенерировать новый тестовый кошелек
cargo run --bin solquest-cli -- new-wallet

# 2. Исследовать PDA адрес любого пользователя (математика сидов и bump)
cargo run --bin solquest-cli -- inspect-pda --user <ПУБЛИЧНЫЙ_КЛЮЧ>

# 3. Инициализировать on-chain профиль через CLI
cargo run --bin solquest-cli -- init-profile --username "SolanaDev" --bio "Building on Devnet"

# 4. Инкрементировать счетчик
cargo run --bin solquest-cli -- increment

# 5. Прочитать данные профиля из блокчейна (десериализация Borsh)
cargo run --bin solquest-cli -- get-profile --user <ПУБЛИЧНЫЙ_КЛЮЧ>

# 6. Заклеймить SPL токены $QUEST
cargo run --bin solquest-cli -- claim-reward --mint <MINT_ADDRESS> --amount 10000000
```

---

### 2. Запуск тестов смарт-контракта (Недели 4–7)
Интеграционный тест проверяет весь цикл работы: создание конфига, создание профиля через PDA, инкремент счётчика, CPI минт SPL токенов и трансфер токенов между пользователями:

```powershell
npm install
npm test
```

---

### 3. Запуск Web3 MVP интерфейса (Неделя 8)
Веб-приложение запускается на локальном сервере разработки и подключается к Devnet:

```powershell
cd app
npm install
npm run dev
```
После запуска откройте `http://localhost:3000` в браузере, подключите кошелек Phantom или Solflare в режиме **Devnet**!

---

## 🔬 Ключевые концепции Solana, продемонстрированные в проекте

1. **PDA (Program Derived Addresses)**:
   - Адреса аккаунтов не имеют приватных ключей, деривируются детерминированно из сидов:
     `Pubkey::find_program_address(&[b"user-profile", authority.as_ref()], &program_id)`.
   - Программа подписывает транзакции от имени своего PDA при помощи `CpiContext::new_with_signer` с каноническим `bump`.
2. **CPI (Cross-Program Invocation)**:
   - Вызов программы SPL Token (`spl_token::instruction::mint_to`) напрямую из нашего контракта при клейме наград.
3. **Borsh Serialization**:
   - Быстрая и компактная сериализация данных аккаунтов как в смарт-контракте, так и в автономном клиенте на Rust.
4. **Anchor Framework**:
   - Валидация аккаунтов через макросы `#[derive(Accounts)]`, автопроверка владельца `has_one = authority`, подсчёт места через `#[derive(InitSpace)]`.
