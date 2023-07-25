# Hato Status

Hato / Hato API 稼働状況監視システム

## 概要

Hatoのサービス運営に必要であるHato / Hato APIの稼働状況をリアルタイムで監視・記録するとともに、今後予定されているメンテナンス情報を提供するAPIです。

## システム構成

### 監視システム・監視情報API

|||
|:---|:---:|
|Cloudflare Workers (Fetch trigger)|監視情報APIの提供|
|Cloudflare Workers (Cron trigger)|監視タスクの定期実行|
|Cloudflare KV|最新監視結果の保存（一時的）|
|Cloudflare D1|毎時監視結果の保存（永続的）|

### メンテナンス情報API

|||
|:---|:---:|
|Cloudflare Workers (Fetch trigger)|メンテナンス情報APIの提供|
|Cloudflare KV|メンテナンス情報の保存（永続的）|
