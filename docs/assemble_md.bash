#!/bin/bash

# Проверяем аргументы
if [ $# -lt 2 ]; then
  echo "Использование: $0 <директория_источник> <выходной_файл>"
  echo "Пример: $0 ./ full_documentation.md"
  exit 1
fi

SOURCE_DIR="$1"
OUTPUT_FILE="$2"

# Проверяем существование директории
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Ошибка: Директория '$SOURCE_DIR' не существует"
  exit 1
fi

echo "Сборка MD файлов из: $SOURCE_DIR"
echo "Выходной файл: $OUTPUT_FILE"

# Создаем пустой выходной файл
>"$OUTPUT_FILE"

# Добавляем заголовок
echo "# Собранная документация" >>"$OUTPUT_FILE"
echo "" >>"$OUTPUT_FILE"
echo "*Собрано автоматически из директории: \`$SOURCE_DIR\`*" >>"$OUTPUT_FILE"
echo "*Дата сборки: $(date)*" >>"$OUTPUT_FILE"
echo "" >>"$OUTPUT_FILE"
echo "---" >>"$OUTPUT_FILE"
echo "" >>"$OUTPUT_FILE"

# Счетчики
TOTAL_FILES=0
PROCESSED_FILES=0

# Функция для обработки каждого MD файла
process_md_file() {
  local file="$1"
  local relative_path="${file#$SOURCE_DIR/}"

  echo "📄 Обработка: $relative_path"

  # Добавляем разделитель и информацию о файле
  echo "## Файл: \`$relative_path\`" >>"$OUTPUT_FILE"
  echo "" >>"$OUTPUT_FILE"
  echo "---" >>"$OUTPUT_FILE"
  echo "" >>"$OUTPUT_FILE"

  # Добавляем содержимое файла
  cat "$file" >>"$OUTPUT_FILE"

  # Добавляем разделитель между файлами
  echo "" >>"$OUTPUT_FILE"
  echo "" >>"$OUTPUT_FILE"
  echo "---" >>"$OUTPUT_FILE"
  echo "" >>"$OUTPUT_FILE"

  ((PROCESSED_FILES++))
}

# Рекурсивно ищем все .md файлы и сортируем их
while IFS= read -r -d '' file; do
  ((TOTAL_FILES++))
done < <(find "$SOURCE_DIR" -type f -name "*.md" -print0)

echo "Найдено MD файлов: $TOTAL_FILES"

# Обрабатываем файлы в отсортированном порядке (для стабильного результата)
find "$SOURCE_DIR" -type f -name "*.md" | sort | while read -r file; do
  process_md_file "$file"
done

# Добавляем статистику в конец
echo "" >>"$OUTPUT_FILE"
echo "---" >>"$OUTPUT_FILE"
echo "" >>"$OUTPUT_FILE"
echo "## Статистика сборки" >>"$OUTPUT_FILE"
echo "" >>"$OUTPUT_FILE"
echo "- **Директория источник:** \`$SOURCE_DIR\`" >>"$OUTPUT_FILE"
echo "- **Обработано файлов:** $PROCESSED_FILES из $TOTAL_FILES" >>"$OUTPUT_FILE"
echo "- **Дата сборки:** $(date)" >>"$OUTPUT_FILE"
echo "- **Размер выходного файла:** $(wc -l <"$OUTPUT_FILE") строк" >>"$OUTPUT_FILE"

echo ""
echo "✅ Готово!"
echo "Обработано файлов: $PROCESSED_FILES"
echo "Создан файл: $OUTPUT_FILE"
