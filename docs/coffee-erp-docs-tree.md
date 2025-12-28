# [DRAFT] Coffee-ERP Automation System Documentation

/root
├── /01_core_architecture
│   ├── business_hierarchy.md       # SU, Бизнесы, Предприятия, Подразделения (типы: Склад/Цех/Точка)
│   ├── auth_system.md              # Инвайты (Email/TG), Magic Links, восстановление пароля
│   └── rbac_matrix.md              # Матрица ролей (Admin, Manager, Barista) и их полномочий
│
├── /02_inventory_and_production
│   ├── scope_logic.md              # Глобальный vs Локальный склад, копирование продуктов
│   ├── products_card.md            # КБЖУ, Базовая цена, Мин. остатки, MOQ (квант заказа)
│   ├── ttk_engine.md               # Динамический расчет ТТК, маржа, вложенные рецепты
│   ├── supply_orders.md            # Заявки на склад, логика кнопок [+] [-] с шагом MOQ
│   ├── blind_inventory.md          # Система слепой ревизии (инициация, агрегация данных)
│   └── utility_consumables.md      # Непищевые расходники (химия, салфетки)
│
├── /03_staff_and_scheduling
│   ├── shift_logic.md              # Кнопки "Старт/Конец", Доп. смены, учет часов
│   ├── anti_zombie.md              # MAX_SHIFT_DURATION, авто-закрытие и уведомления
│   ├── scheduling_grid.md          # Интерфейс-таблица, пожелания сотрудников, алерты
│   └── shift_swaps.md              # Механика обмена сменами (Запрос -> Подтверждение)
│
├── /04_payroll_finance_light
│   ├── salary_schemes.md           # Белая, Серая, Черная схемы; фиксированная белая часть
│   ├── tax_and_rates.md            # Глобальные % налога vs Индивидуальные в карточке
│   └── payslip_details.md          # Расчетный листок: детализация правок, премий и штрафов
│
├── /05_education_and_hr
│   ├── certification_constructor.md # Суб-конструкторы (Теория/Практика/Беседа), слайдеры оценок
│   ├── knowledge_base.md           # Медиа-база: видео-инструкции, техкарты, регламенты
│   ├── gamification.md             # Рейтинги сотрудников, накопление XP за задачи
│   └── compliance_staff.md         # Контроль медкнижек и допусков по ТБ
│
├── /06_operational_control
│   ├── checklist_engine.md         # Цифровые обходы (туалеты, зал), тайминги, логирование
│   ├── haccp_journals.md           # Температурные журналы, сан. нормы, уведомления о пропуске
│   ├── equipment_maintenance.md    # Реестр оборудования, история ТО, контакты мастеров
│   ├── incident_log.md             # Журнал происшествий (фото, комментарии, привязка к смене)
│   └── mystery_guest_audit.md      # Анкета внешнего аудита, связь с дашбордом точки
│
├── /07_guest_experience
│   ├── digital_menu_logic.md       # Публичная доска: ТТК "на продажу", КБЖУ, аллергены, Storytelling
│   ├── menu_pricing.md             # Локальные цены для меню vs Глобальные цены бизнеса
│   └── qr_generator.md             # Генерация ссылок для конкретных подразделений
│
├── /08_communications
│   ├── notification_hub.md         # Логика "Колокольчика", приоритеты уведомлений
│   ├── telegram_bot_spec.md        # Команды бота, шаблоны алертов (Анти-зомби, ХАССП)
│   └── marketing_bulletin.md       # Инфо-доска для персонала: обязательное ознакомление
│
└── backlog.md                      # Общий список задач, приоритеты и фазы разработки
