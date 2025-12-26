# Supabase 迁移指南：日期字段从字符串改为时间戳

## 概述

此迁移将 `problems` 表的 `日期` 列从 `TEXT`（字符串）类型改为 `BIGINT`（Unix 时间戳，毫秒）。

## 迁移步骤

### 1. 备份数据（强烈建议）

在执行迁移前，先备份现有数据：

```sql
-- 创建备份表
CREATE TABLE problems_backup AS
SELECT * FROM problems;

-- 验证备份
SELECT COUNT(*) FROM problems;
SELECT COUNT(*) FROM problems_backup;
```

### 2. 执行迁移脚本

在 Supabase Dashboard 的 SQL Editor 中执行 `migrations/migrate_date_to_timestamp.sql`：

```bash
# 查看迁移脚本
cat supabase/migrations/migrate_date_to_timestamp.sql
```

### 3. 验证迁移结果

执行以下查询验证数据是否正确转换：

```sql
-- 查看前 10 条记录的时间戳转换结果
SELECT
  id,
  "日期",
  to_timestamp("日期" / 1000) AT TIME ZONE 'UTC' as converted_date,
  created_at
FROM problems
ORDER BY "日期" DESC
LIMIT 10;

-- 检查是否有 NULL 值
SELECT COUNT(*) FROM problems WHERE "日期" IS NULL;

-- 检查时间戳是否合理（应该在 2020-2030 年之间）
SELECT COUNT(*) FROM problems
WHERE "日期" < 1577836800000  -- 2020-01-01
   OR "日期" > 1893456000000; -- 2030-01-01
```

### 4. 更新应用代码

应用代码已经更新完成：
- ✅ TypeScript 类型定义已更新（`日期: number`）
- ✅ 所有数据库操作已更新
- ✅ UI 组件已更新（datetime-local 输入与时间戳转换）

### 5. 测试应用

1. 启动应用：`npm run dev`
2. 登录并切换到 Cloud 模式
3. 测试以下功能：
   - ✅ 查看现有题目列表
   - ✅ 添加新题目
   - ✅ 编辑现有题目
   - ✅ 导入/导出 CSV
   - ✅ 查看统计图表

## 回滚计划

如果迁移出现问题，可以从备份恢复：

```sql
-- 删除当前表
DROP TABLE problems;

-- 从备份恢复
CREATE TABLE problems AS
SELECT * FROM problems_backup;

-- 重建索引和权限（参考 schema.sql）
```

## 迁移原理

迁移脚本执行以下步骤：

1. **添加新列**：创建 `日期_new` (BIGINT) 列
2. **数据转换**：
   - 解析 `YYYY-MM-DD HH:mm:ss` 格式
   - 解析 `YYYY/MM/DD HH:mm:ss` 格式
   - 转换为 Unix 时间戳（毫秒）
   - 无效日期使用当前时间
3. **设置约束**：将新列设为 NOT NULL
4. **替换列**：删除旧列，重命名新列
5. **重建索引**：为时间戳列创建索引

## 注意事项

- ⚠️ **执行前备份**：务必先备份数据
- ⚠️ **停机时间**：迁移期间用户无法访问数据
- ⚠️ **不可逆操作**：删除列后无法恢复（除非有备份）
- ✅ **向后兼容**：应用代码同时支持新旧格式

## 技术细节

### 时间戳格式
- **存储**：BIGINT（毫秒）
- **时区**：UTC
- **示例**：`1735689600000` = `2025-01-01 00:00:00 UTC`

### 日期字符串支持格式
- `2025-01-01 10:00:00`
- `2025/01/01 10:00:00`
- ISO 8601: `2025-01-01T10:00:00.000Z`

### SQL 转换逻辑
```sql
-- 提取时间戳（毫秒）
EXTRACT(EPOCH FROM (date_string::timestamp) AT TIME ZONE 'UTC') * 1000
```

## 常见问题

**Q: 迁移会影响现有用户吗？**
A: 迁移期间会有短暂停机，建议在低峰期执行。

**Q: 如果数据格式不规范怎么办？**
A: 迁移脚本会尝试解析多种格式，无法解析的记录使用当前时间戳。

**Q: 迁移后还能使用旧版应用吗？**
A: 不能。应用代码已同步更新，必须使用新版本。

**Q: 如何确认迁移成功？**
A: 运行验证查询，确保所有记录都有合理的时间戳值。
