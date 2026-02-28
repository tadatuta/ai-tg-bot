# ElectroVafin (Telegram Bot with Gemini 3 Flash and Yandex Cloud)

Этот проект представляет собой Telegram-бота на Node.js и TypeScript. Бот использует модель Gemini 3 Flash (via Google Vertex AI API) для генерации ответов и предназначен для развертывания в Яндекс Облаке (Yandex Cloud Functions).

## Требования

- Node.js >= 20
- Учетная запись Google Cloud (с включенным Vertex AI API и настроенным биллингом)
- [Yandex Cloud CLI (`yc`)](https://yandex.cloud/ru/docs/cli/quickstart)
- Telegram Bot Token (полученный от [@BotFather](https://t.me/BotFather))

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

2. **Экспортируйте переменные окружения:**
   ```bash
   export VERTEX_PROJECT_ID=ваши_данные
   export VERTEX_LOCATION=us-central1
   export GEMINI_MODEL_ID=gemini-1.5-flash-002
   export BOT_TOKEN=ваш_токен
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
