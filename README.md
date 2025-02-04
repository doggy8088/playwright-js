# Playwright.js

由於 [Playwright](https://playwright.dev/) 是一套基於 Node.js 的 E2E 自動化測試工具，其優異的 [Locators](https://playwright.dev/docs/locators) 與 [Actions](https://playwright.dev/docs/input) 的 APIs 非常的好用，可惜官方並沒有提供可執行在原生瀏覽器的 JS 函式庫版本。因此本專案特別實作了一遍幾個重要的 APIs，讓開發者可以在原生瀏覽器中使用 Playwright 的 Locators API。此舉將可大幅改善原生瀏覽器的自動化任務。

## 支援的 Page API

- [page.getByRole()](https://playwright.dev/docs/locators#locate-by-role) 來根據顯性和隱性可及性屬性定位。
- [page.getByText()](https://playwright.dev/docs/locators#locate-by-text) 來根據文本內容定位。
- [page.getByLabel()](https://playwright.dev/docs/locators#locate-by-label) 來根據關聯標籤的文本定位表單控制項。
- [page.getByPlaceholder()](https://playwright.dev/docs/locators#locate-by-placeholder) 來根據佔位符定位輸入框。
- [page.getByAltText()](https://playwright.dev/docs/locators#locate-by-alt-text) 來根據文本替代內容定位元素，通常是圖片。
- [page.getByTitle()](https://playwright.dev/docs/locators#locate-by-title) 來根據標題屬性定位元素。
- [page.getByTestId()](https://playwright.dev/docs/locators#locate-by-test-id) 來根據 `data-testid` 屬性定位元素（其他屬性可以配置）。

- [page.addInitScript()](https://playwright.dev/docs/api/class-page#page-add-init-script) 新增一個 JS 或執行一段 JS 程式碼。

## 載入 JS

1. 直接從網頁中加入
    
    ```html
    <script src="https://doggy8088.github.io/playwright-js/src/playwright.js"></script>
    ```

2. 從網頁中動態加入

    ```js
    var pwjs = document.createElement('script');
    pwjs.src = 'https://doggy8088.github.io/playwright-js/src/playwright.js';
    pwjs.async = true;
    pwjs.onload = () => {
      console.log('Script loaded successfully!');
    };
    pwjs.onerror = () => {
        console.error(`Failed to load script: ${pwjs.src}`);
    };
    document.head.appendChild(pwjs);
    ```
    
使用範例請見 [tests/index.html](tests/index.html)

## 相關連結

- Playwright
  - [Page](https://playwright.dev/docs/api/class-page)
  - [Actions](https://playwright.dev/docs/input)
  - [Locators](https://playwright.dev/docs/locators)
- web.dev
  - [ARIA and HTML](https://web.dev/learn/accessibility/aria-html)
- W3C
  - [ARIA in HTML](https://www.w3.org/TR/html-aria/#docconformance)
