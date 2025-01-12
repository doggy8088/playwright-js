# Playwright.js

由於 [Playwright](https://playwright.dev/) 是一套基於 Node.js 的 E2E 自動化測試工具，其優異的 [Locators](https://playwright.dev/docs/locators) API 非常的好用，可惜官方並沒有提供可執行在原生瀏覽器的 JS 函式庫版本，因此本專案特別實作了一遍幾個重要的 APIs，讓開發者可以在原生瀏覽器中使用 Playwright 的 Locators API。此舉將可大幅改善原生瀏覽器的自動化任務。

## 支援的 API

- [page.getByRole()](https://playwright.dev/docs/locators#locate-by-role) 來根據顯性和隱性可及性屬性定位。
- [page.getByText()](https://playwright.dev/docs/locators#locate-by-text) 來根據文本內容定位。
- [page.getByLabel()](https://playwright.dev/docs/locators#locate-by-label) 來根據關聯標籤的文本定位表單控制項。
- [page.getByPlaceholder()](https://playwright.dev/docs/locators#locate-by-placeholder) 來根據佔位符定位輸入框。
- [page.getByAltText()](https://playwright.dev/docs/locators#locate-by-alt-text) 來根據文本替代內容定位元素，通常是圖片。
- [page.getByTitle()](https://playwright.dev/docs/locators#locate-by-title) 來根據標題屬性定位元素。
- [page.getByTestId()](https://playwright.dev/docs/locators#locate-by-test-id) 來根據 `data-testid` 屬性定位元素（其他屬性可以配置）。

## 載入 JS

```html
<script src="https://doggy8088.github.io/playwright-js/src/playwright.js"></script>
```
