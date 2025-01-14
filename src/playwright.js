(() => {

    class Locator {
        constructor(selector, options = {}, page, parentLocator = null) {
            this._selector = selector;
            this._options = options;
            this._page = page;
            this._parentLocator = parentLocator;
        }

        locator(selector) {
            return new Locator(selector, {}, this._page, this);
        }

        async _resolveElements() {
            const parentElement = this._parentLocator ? await this._parentLocator._resolveElements() : [document];
            let elements = [];
            for (const parent of parentElement) {
                const found = await this._page._queryElements(this._selector, this._options, parent);
                elements = elements.concat(found);
            }
            return elements;
        }

        async first() {
            const elements = await this._resolveElements();
            return elements[0] ? new Locator('', { resolvedElement: elements[0] }, this._page) : null;
        }

        async last() {
            const elements = await this._resolveElements();
            return elements.length > 0 ? new Locator('', { resolvedElement: elements[elements.length - 1] }, this._page) : null;
        }

        async nth(index) {
            const elements = await this._resolveElements();
            return elements[index] ? new Locator('', { resolvedElement: elements[index] }, this._page) : null;
        }

        async all() {
            return await this._resolveElements();
        }

        async fill(value) {
            const element = await this._resolveElement();
            if (element) {
                element.focus();
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        async pressSequentially(value) {
            const element = await this._resolveElement();
            if (element) {
                element.focus();

                // 清空現有內容 (如果需要)
                element.value = '';
                element.dispatchEvent(new Event('input', { bubbles: true }));

                for (const char of value) {
                    element.dispatchEvent(new KeyboardEvent('keydown', {
                        key: char,
                        code: `Key${char.toUpperCase()}`, // 簡易的 code 模擬
                        bubbles: true,
                        cancelable: true,
                        composed: true
                    }));

                    element.dispatchEvent(new KeyboardEvent('keypress', {
                        key: char,
                        charCode: char.charCodeAt(0),
                        bubbles: true,
                        cancelable: true,
                        composed: true
                    }));

                    element.value += char;
                    element.dispatchEvent(new Event('input', { bubbles: true }));

                    element.dispatchEvent(new KeyboardEvent('keyup', {
                        key: char,
                        code: `Key${char.toUpperCase()}`, // 簡易的 code 模擬
                        bubbles: true,
                        cancelable: true,
                        composed: true
                    }));

                    await new Promise((r) => setTimeout(r, 33));
                }

                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        async check() {
            const element = await this._resolveElement();
            if (element && element.type === 'checkbox' && !element.checked) {
                element.click();
            }
        }

        async uncheck() {
            const element = await this._resolveElement();
            if (element && element.type === 'checkbox' && element.checked) {
                element.click();
            }
        }

        async evaluate(fn) {
            const element = await this._resolveElement();
            return element ? fn(element) : null;
        }

        async focus() {
            const element = await this._resolveElement();
            element?.focus();
        }

        async selectOption(value) {
            const element = await this._resolveElement();
            if (element && element.tagName.toLowerCase() === 'select') {
                const option = Array.from(element.options).find(opt => opt.value === value || opt.textContent === value);
                if (option) {
                    element.value = option.value;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }

        async click(options) {
            const element = await this._resolveElement();
            if (options?.button || options?.modifiers) {
                await element.evaluate((el, opts) => {
                    const event = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        button: opts.button === 'right' ? 2 : 0,
                        ctrlKey: opts.modifiers?.includes('ControlOrMeta') || false,
                        shiftKey: opts.modifiers?.includes('Shift') || false,
                        metaKey: opts.modifiers?.includes('ControlOrMeta') || false
                    });
                    el.dispatchEvent(event);
                }, options);
            } else {
                element?.click();
            }
        }

        async dblclick() {
            const element = await this._resolveElement();
            element?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
        }

        async press(key) {
            const element = await this._resolveElement();
            element?.focus();
            element?.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, composed: true }));
            element?.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true, composed: true }));
        }

        async hover() {
            const element = await this._resolveElement();
            element?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true }));
        }

        async scrollIntoViewIfNeeded() {
            const element = await this._resolveElement();
            element?.scrollIntoViewIfNeeded();
        }

        async isVisible() {
            const element = await this._resolveElement();
            return element && element.offsetParent !== null;
        }

        async _resolveElement() {
            if (this._options.resolvedElement) {
                return this._options.resolvedElement;
            }
            const elements = await this._resolveElements();
            return elements[0];
        }
    }

    const page = {

        WAIT_TIMEOUT: 5000,
        WAIT_INTERVAL: 100,

        _queryElements: async function (selector, options, parentElement) {
            const start = Date.now();
            while (true) {
                let filteredElements;
                if (typeof selector === 'function') {
                    filteredElements = await selector(options, parentElement);
                } else {
                    filteredElements = Array.from(parentElement.querySelectorAll(selector));
                }

                if (filteredElements.length) return filteredElements;
                if (Date.now() - start >= page.WAIT_TIMEOUT) return [];
                await new Promise((r) => setTimeout(r, page.WAIT_INTERVAL));
            }
        },
        /**
         * 根據 ARIA role 查找元素，包含完整的隱含 role 判斷。
         * @param {string} role - ARIA role 名稱。
         * @param {object} [options] - 選項。
         * @param {string|RegExp} [options.name] - 可訪問的名稱。可以是字串或正則表達式。
         * @param {boolean} [options.exact] - 是否精確匹配名稱。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {Locator} - 匹配元素的 Locator 物件。
         */
        getByRole(role, options = {}, parentElement = document) {
            const selectorFn = async (opts, parentElement) => {
                const implicitRoles = {
                    'a[href]': 'link',
                    'a:not([href])': 'generic',
                    'address': 'group',
                    'area[href]': 'link',
                    'area:not([href])': 'generic',
                    'article': 'article',
                    'aside': 'complementary',
                    'button': 'button',
                    'caption': 'caption',
                    'code': 'code',
                    'data': 'generic',
                    'datalist': 'listbox',
                    'del': 'deletion',
                    'details': 'group',
                    'dfn': 'term',
                    'dialog': 'dialog',
                    'div': 'generic',
                    'em': 'emphasis',
                    'fieldset': 'group',
                    'figure': 'figure',
                    'footer:not(article footer, aside footer, main footer, nav footer, section footer,[role="article"] footer,[role="complementary"] footer,[role="main"] footer,[role="navigation"] footer,[role="region"] footer)': 'contentinfo',
                    'footer': 'generic',
                    'form': 'form',
                    'h1': 'heading',
                    'h2': 'heading',
                    'h3': 'heading',
                    'h4': 'heading',
                    'h5': 'heading',
                    'h6': 'heading',
                    'header:not(article header, aside header, main header, nav header, section header,[role="article"] header,[role="complementary"] header,[role="main"] header,[role="navigation"] header,[role="region"] header)': 'banner',
                    'header': 'generic',
                    'hgroup': 'group',
                    'hr': 'separator',
                    'html': 'document',
                    'i': 'generic',
                    'img[alt]': 'img',
                    'img:not([alt])': 'img', // 需要進一步判斷是否有其他命名方法
                    'input[type="button"]': 'button',
                    'input[type="checkbox"]': 'checkbox',
                    'input[type="email"]:not([list])': 'textbox',
                    'input[type="image"]': 'button',
                    'input[type="number"]': 'spinbutton',
                    'input[type="radio"]': 'radio',
                    'input[type="range"]': 'slider',
                    'input[type="reset"]': 'button',
                    'input[type="search"]:not([list])': 'searchbox',
                    'input[type="submit"]': 'button',
                    'input[type="tel"]:not([list])': 'textbox',
                    'input[type="text"]:not([list])': 'textbox',
                    'input[list]': 'combobox',
                    'ins': 'insertion',
                    'li:is(:scope > ul > *, :scope > ol > *, :scope > menu > *)': 'listitem',
                    'li': 'generic',
                    'main': 'main',
                    'math': 'math',
                    'menu': 'list',
                    'meter': 'meter',
                    'nav': 'navigation',
                    'ol': 'list',
                    'optgroup': 'group',
                    'option': 'option',
                    'output': 'status',
                    'p': 'paragraph',
                    'pre': 'generic',
                    'progress': 'progressbar',
                    'q': 'generic',
                    's': 'deletion',
                    'samp': 'generic',
                    'search': 'search',
                    'section[aria-label]': 'region',
                    'section[aria-labelledby]': 'region',
                    'section': 'generic',
                    'select:not([multiple]):not([size])': 'combobox',
                    'select[multiple], select[size]:not([size="1"])': 'listbox',
                    'small': 'generic',
                    'span': 'generic',
                    'strong': 'strong',
                    'sub': 'subscript',
                    'summary': 'button', // 注意：並非所有 User Agent 都會暴露為 button
                    'sup': 'superscript',
                    'svg': 'graphics-document',
                    'table': 'table',
                    'tbody': 'rowgroup',
                    'td': (element) => {
                        const table = element.closest('table');
                        if (table) {
                            const tableRole = table.getAttribute('role');
                            if (tableRole === 'grid' || tableRole === 'treegrid') {
                                return 'gridcell';
                            } else if (tableRole !== 'presentation' && tableRole !== 'none') {
                                return 'cell';
                            }
                        }
                        return null; // 沒有對應的 role
                    },
                    'textarea': 'textbox',
                    'tfoot': 'rowgroup',
                    'th': (element) => {
                        const table = element.closest('table');
                        if (table) {
                            const tableRole = table.getAttribute('role');
                            if (tableRole === 'grid' || tableRole === 'treegrid') {
                                return 'gridcell'; // 或 columnheader/rowheader，根據具體情況
                            } else if (tableRole !== 'presentation' && tableRole !== 'none') {
                                return 'columnheader'; // 或 rowheader/cell，根據具體情況
                            }
                        }
                        return null; // 沒有對應的 role
                    },
                    'thead': 'rowgroup',
                    'time': 'time',
                    'tr': 'row',
                    'ul': 'list',
                };

                let filteredElements = Array.from(parentElement.querySelectorAll('*')).filter(element => {
                    if (element.getAttribute('aria-disabled') === 'true') {
                        return false;
                    }

                    const explicitRole = element.getAttribute('role');
                    if (explicitRole) {
                        return explicitRole === opts.role;
                    }

                    for (const selector in implicitRoles) {
                        if (element.matches(selector)) {
                            const implicitRole = typeof implicitRoles[selector] === 'function'
                                ? implicitRoles[selector](element)
                                : implicitRoles[selector];
                            if (implicitRole === opts.role) {
                                return true;
                            }
                        }
                    }
                    return false;
                });

                if (opts.name) {
                    filteredElements = filteredElements.filter(element => {
                        const accessibleName = element.getAttribute('aria-label') || element.textContent.trim();
                        if (opts.exact) {
                            return Array.isArray(opts.name)
                                ? opts.name.some(name => accessibleName === name)
                                : accessibleName === opts.name;
                        } else if (Array.isArray(opts.name)) {
                            return opts.name.some(name => accessibleName.includes(name));
                        } else if (typeof opts.name === 'string') {
                            return accessibleName.includes(opts.name);
                        } else if (opts.name instanceof RegExp) {
                            return opts.name.test(accessibleName);
                        }
                        return false;
                    });
                }
                return filteredElements;
            };
            return new Locator(selectorFn.bind(null, { role, ...options }, parentElement), {}, page);
        },

        /**
         * 根據文字內容查找最接近的元素 (使用 TreeWalker)，並排除 head, script, style 標籤。
         * @param {string|RegExp} text - 要查找的文字內容，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配文字內容。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {Locator} - 匹配元素的 Locator 物件。
         */
        getByText(text, options = {}, parentElement = document) {
            const selectorFn = async (opts, parentElement) => {
                const walker = document.createTreeWalker(
                    parentElement,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                const matchingElements = new Set();
                let node;

                while (node = walker.nextNode()) {
                    // 排除 head, script, style 標籤內的文字
                    if (node.parentNode && ['head', 'script', 'style'].includes(node.parentNode.tagName.toLowerCase())) {
                        continue;
                    }

                    const normalizedText = node.textContent.replace(/\s+/g, ' ').trim();
                    let isMatch = false;

                    if (opts.exact) {
                        isMatch = Array.isArray(opts.text)
                            ? opts.text.some(t => normalizedText === t)
                            : normalizedText === opts.text;
                    } else if (Array.isArray(opts.text)) {
                        isMatch = opts.text.some(t => normalizedText.includes(t));
                    } else if (typeof opts.text === 'string') {
                        isMatch = normalizedText.includes(opts.text);
                    } else if (opts.text instanceof RegExp) {
                        isMatch = opts.text.test(normalizedText);
                    }

                    if (isMatch) {
                        matchingElements.add(node.parentNode);
                    }
                }
                return Array.from(matchingElements);
            };
            return new Locator(selectorFn.bind(null, { text, ...options }, parentElement), {}, page);
        },

        /**
         * 根據標籤文字查找元素。
         * @param {string|RegExp} text - 要查找的標籤文字，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配標籤文字。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {Locator} - 匹配元素的 Locator 物件。
         */
        getByLabel(text, options = {}, parentElement = document) {
            const selectorFn = async (opts, parentElement) => {
                const labels = parentElement.querySelectorAll('label');
                let filteredElements = Array.from(labels)
                    .filter(label => {
                        const normalizedText = label.textContent.replace(/\s+/g, ' ').trim();
                        if (opts.exact) {
                            return normalizedText === opts.text;
                        } else if (typeof opts.text === 'string') {
                            return normalizedText.includes(opts.text);
                        } else if (opts.text instanceof RegExp) {
                            return opts.text.test(normalizedText);
                        }
                        return false;
                    })
                    .map(label => {
                        const forAttribute = label.getAttribute('for');
                        if (forAttribute) {
                            return parentElement.getElementById(forAttribute);
                        } else {
                            return label.querySelector('input, select, textarea, button');
                        }
                    })
                    .filter(element => element !== null);
                return filteredElements;
            };
            return new Locator(selectorFn.bind(null, { text, ...options }, parentElement), {}, page);
        },

        /**
         * 根據 Placeholder 文字查找輸入元素。
         * @param {string|RegExp} text - 要查找的 Placeholder 文字，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配 Placeholder 文字。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {Locator} - 匹配元素的 Locator 物件。
         */
        getByPlaceholder(text, options = {}, parentElement = document) {
            const selectorFn = async (opts, parentElement) => {
                const inputs = parentElement.querySelectorAll('input[placeholder], textarea[placeholder]');
                let filteredElements = Array.from(inputs).filter(input => {
                    const placeholderText = input.getAttribute('placeholder');
                    if (opts.exact) {
                        return placeholderText === opts.text;
                    } else if (typeof opts.text === 'string') {
                        return placeholderText.includes(opts.text);
                    } else if (opts.text instanceof RegExp) {
                        return opts.text.test(placeholderText);
                    }
                    return false;
                });
                return filteredElements;
            };
            return new Locator(selectorFn.bind(null, { text, ...options }, parentElement), {}, page);
        },

        /**
         * 根據替代文字查找圖像元素。
         * @param {string|RegExp} text - 要查找的替代文字，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配替代文字。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {Locator} - 匹配元素的 Locator 物件。
         */
        getByAltText(text, options = {}, parentElement = document) {
            const selectorFn = async (opts, parentElement) => {
                const elements = parentElement.querySelectorAll('img[alt], area[alt]');
                let filteredElements = Array.from(elements).filter(element => {
                    const altText = element.getAttribute('alt');
                    if (opts.exact) {
                        return altText === opts.text;
                    } else if (typeof opts.text === 'string') {
                        return altText.includes(opts.text);
                    } else if (opts.text instanceof RegExp) {
                        return opts.text.test(altText);
                    }
                    return false;
                });
                return filteredElements;
            };
            return new Locator(selectorFn.bind(null, { text, ...options }, parentElement), {}, page);
        },

        /**
         * 根據標題屬性查找元素。
         * @param {string|RegExp} text - 要查找的標題文字，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配標題文字。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {Locator} - 匹配元素的 Locator 物件。
         */
        getByTitle(text, options = {}, parentElement = document) {
            const selectorFn = async (opts, parentElement) => {
                const elements = parentElement.querySelectorAll('[title]');
                let filteredElements = Array.from(elements).filter(element => {
                    const titleText = element.getAttribute('title');
                    if (opts.exact) {
                        return titleText === opts.text;
                    } else if (typeof opts.text === 'string') {
                        return titleText.includes(opts.text);
                    } else if (opts.text instanceof RegExp) {
                        return opts.text.test(titleText);
                    }
                    return false;
                });
                return filteredElements;
            };
            return new Locator(selectorFn.bind(null, { text, ...options }, parentElement), {}, page);
        },

        /**
         * 根據測試 ID 查找元素 (支援多種屬性名稱)。
         * @param {string|RegExp} testId - 要查找的測試 ID，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配測試 ID。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {Locator} - 匹配元素的 Locator 物件。
         */
        getByTestId(testId, options = {}, parentElement = document) {
            const selectorFn = async (opts, parentElement) => {
                const testIdAttributes = ['data-testid', 'data-test-id']; // 添加所有可能的屬性名稱

                let filteredElements = Array.from(parentElement.querySelectorAll('*')).filter(element => {
                    for (const attr of testIdAttributes) {
                        if (element.hasAttribute(attr)) {
                            const attributeValue = element.getAttribute(attr);
                            if (opts.exact) {
                                return attributeValue === opts.testId;
                            } else if (typeof opts.testId === 'string') {
                                return attributeValue.includes(opts.testId);
                            } else if (opts.testId instanceof RegExp) {
                                return opts.testId.test(attributeValue);
                            }
                        }
                    }
                    return false;
                });
                return filteredElements;
            };
            return new Locator(selectorFn.bind(null, { testId, ...options }, parentElement), {}, page);
        },

        async addInitScript(script, ...args) {
            if (typeof script === 'function') {
                script.apply(null, args);
            } else if (script.path) {
                // 處理物件形式的呼叫 {path: string}
                var scriptElement = document.createElement('script');
                scriptElement.src = script.path;
                scriptElement.async = true;

                return new Promise((resolve, reject) => {
                    scriptElement.onload = () => {
                        console.log('Script loaded successfully!');
                        resolve();
                    };
                    scriptElement.onerror = () => {
                        reject(new Error(`Failed to load script: ${script.path}`));
                    };
                    document.head.appendChild(scriptElement);
                });
            } else {
                throw new Error('Invalid script parameter');
            }
        },

    };

    window.page = page;

    // 使用範例
    // await page.getByRole('button', { name: 'Submit' }).click();
    // await page.getByText('Some text').hover();
    // await page.getByLabel('Username').fill('testuser');

})();