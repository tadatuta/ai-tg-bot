# ElectroVafin (Telegram Bot with Gemini 3 Flash and Yandex Cloud)

Этот проект представляет собой Telegram-бота на Node.js и TypeScript. Бот использует модель Gemini 3 Flash (via Google Vertex AI API) для генерации ответов и предназначен для развертывания в Яндекс Облаке (Yandex Cloud Functions).

## Требования

- Node.js >= 20
- Учетная запись Google Cloud (с включенным Vertex AI API и настроенным биллингом)
- [Yandex Cloud CLI (`yc`)](https://yandex.cloud/ru/docs/cli/quickstart)
- Telegram Bot Token (полученный от [@BotFather](https://t.me/BotFather))

## Настройка Inline-режима (BotFather)

Для работы инлайн-ответов бота (когда вы обращаетесь к боту через `@username` в любом чате), необходимо настроить несколько параметров через [@BotFather](https://t.me/BotFather):

1. **Включите Inline-режим:**
   - Отправьте команду `/setinline`
   - Выберите вашего бота.
   - Отправьте текст-заглушку для инлайн-режима (например, `Введите запрос...`).

2. **Включите Inline Feedback (ОБЯЗАТЕЛЬНО):**
   - Отправьте команду `/setinlinefeedback`
   - Выберите вашего бота.
   - Выберите `Enabled`.
   - Установите вероятность получения отзывов на **100%** (выберите `100%` или `1/1`).
   
   *Примечание:* Это критически важно для работы бота, так как генерация ответа от LLM занимает длительное время. Бот мгновенно возвращает результат-заглушку, а после того как пользователь его выберет (событие `chosen_inline_result`), бот асинхронно генерирует ответ и обновляет сообщение. Без включенного Inline Feedback на 100% бот не будет получать события о выборе результата и сообщение зависнет на статусе загрузки.

## Установка и локальный запуск

1. **Клонируйте репозиторий и установите зависимости:**
   ```bash
   npm install
   ```

2. **Настройте переменные окружения:**
   В корне проекта (или в настройках вашего Cloud Function) вам потребуются следующие переменные:
   - `BOT_TOKEN`: Уникальный токен вашего Telegram-бота.
   - `VERTEX_PROJECT_ID`: ID проекта в Google Cloud.
   - `VERTEX_LOCATION`: Регион в Vertex AI (по умолчанию `us-central1`).
   - `GEMINI_MODEL_ID`: Идентификатор модели, по умолчанию используется `gemini-1.5-flash-002` (Gemini 3 Flash).
   - *Для локального запуска* также потребуется переменная `GOOGLE_APPLICATION_CREDENTIALS` (путь к JSON-файлу сервисного аккаунта GCP).
   
   **Для деплоя в Яндекс Облако (Yandex Cloud) потребуется задать дополнительные переменные в `.env` файле (или экспортировать их):**
   - `FUNCTION_NAME`: Имя облачной функции.
   - `SERVICE_ACCOUNT`: Имя сервисного аккаунта в Yandex Cloud.
   - `BUCKET_NAME`: Имя бакета Object Storage для монтирования.
   - `MOUNT_PREFIX`: Префикс в бакете.
   - `MOUNT_POINT`: Точка монтирования внутри функции.

3. **Редактирование базового промпта:**
   Базовый системный промпт находится в файле `prompt.txt`. Вы можете легко редактировать его перед каждым деплоем бота:
   ```txt
   Ты полезный AI-ассистент в Telegram. Отвечай кратко, вежливо и по делу.
   ```

## Развертывание в Яндекс Облаке

Деплой реализован для **Serverless Yandex Cloud Functions**.

1. **Авторизуйтесь в Yandex Cloud:**
   ```bash
   yc init
   ```

2. **Задайте переменные окружения:**
   Создайте файл `.env` в корне проекта или экспортируйте переменные перед деплоем:
   ```bash
   export VERTEX_PROJECT_ID=ваши_данные
   export VERTEX_LOCATION=us-central1
   export GEMINI_MODEL_ID=gemini-1.5-flash-002
   export BOT_TOKEN=ваш_токен
   export FUNCTION_NAME=my-function
   export SERVICE_ACCOUNT=some-acc
   export BUCKET_NAME=some-bucket
   export MOUNT_PREFIX=fldr
   export MOUNT_POINT=fldr
   ```

3. **Запустите скрипт деплоя:**
   Скрипт соберет TypeScript-код, упакует его и создаст новую версию облачной функции.
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

4. **Интеграция с Telegram (Webhook):**
   После успешного деплоя Яндекс Облако выдаст `http_invoke_url` (ссылку на вашу функцию). Сделайте её публичной в настройках функции, а затем привяжите к Telegram:`
   ```bash
   chmod +x scripts/set-webhook.sh
   export FUNCTION_URL="ваша_ссылка_из_яндекса"
   ./scripts/set-webhook.sh
   ```

> Примечание по адаптерам: Функция использует простой механизм передачи `update` из webhook прямо в инстанс grammy бота, чтобы минимизировать зависимости и ускорить время холодного старта.
