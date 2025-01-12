(() => {
    const WAIT_TIMEOUT = 5000;
    const WAIT_INTERVAL = 100;

    const page = {
        /**
         * 根據 ARIA role 查找元素，包含完整的隱含 role 判斷。
         * @param {string} role - ARIA role 名稱。
         * @param {object} [options] - 選項。
         * @param {string|RegExp} [options.name] - 可訪問的名稱。可以是字串或正則表達式。
         * @param {boolean} [options.exact] - 是否精確匹配名稱。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {NodeListOf<HTMLElement>} - 匹配的元素列表。
         */
        async getByRole(role, options = {}, parentElement = document) {
            const start = Date.now();
            while (true) {
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
                    const explicitRole = element.getAttribute('role');
                    if (explicitRole) {
                        return explicitRole === role;
                    }

                    for (const selector in implicitRoles) {
                        if (element.matches(selector)) {
                            const implicitRole = typeof implicitRoles[selector] === 'function'
                                ? implicitRoles[selector](element)
                                : implicitRoles[selector];
                            if (implicitRole === role) {
                                return true;
                            }
                        }
                    }
                    return false;
                });

                if (options.name) {
                    filteredElements = filteredElements.filter(element => {
                        const accessibleName = element.getAttribute('aria-label') || element.textContent.trim();
                        if (options.exact) {
                            return accessibleName === options.name;
                        } else if (typeof options.name === 'string') {
                            return accessibleName.includes(options.name);
                        } else if (options.name instanceof RegExp) {
                            return options.name.test(accessibleName);
                        }
                        return false;
                    });
                }

                if (filteredElements.length) return filteredElements;
                if (Date.now() - start >= WAIT_TIMEOUT) return [];
                await new Promise((r) => setTimeout(r, WAIT_INTERVAL));
            }
        },

        /**
         * 根據文字內容查找最接近的元素 (使用 TreeWalker)，並排除 head, script, style 標籤。
         * @param {string|RegExp} text - 要查找的文字內容，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配文字內容。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {NodeListOf<HTMLElement>} - 匹配的元素列表。
         */
        async getByText(text, options = {}, parentElement = document) {
            const start = Date.now();
            while (true) {
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
                    if (options.exact) {
                        isMatch = normalizedText === text;
                    } else if (typeof text === 'string') {
                        isMatch = normalizedText.includes(text);
                    } else if (text instanceof RegExp) {
                        isMatch = text.test(normalizedText);
                    }

                    if (isMatch) {
                        matchingElements.add(node.parentNode);
                    }
                }

                const filteredElements = Array.from(matchingElements);

                if (filteredElements.length) return filteredElements;
                if (Date.now() - start >= WAIT_TIMEOUT) return [];
                await new Promise((r) => setTimeout(r, WAIT_INTERVAL));
            }
        },

        /**
         * 根據標籤文字查找元素。
         * @param {string|RegExp} text - 要查找的標籤文字，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配標籤文字。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {NodeListOf<HTMLElement>} - 匹配的元素列表。
         */
        async getByLabel(text, options = {}, parentElement = document) {
            const start = Date.now();
            while (true) {
                const labels = parentElement.querySelectorAll('label');
                let filteredElements = Array.from(labels)
                    .filter(label => {
                        const normalizedText = label.textContent.replace(/\s+/g, ' ').trim();
                        if (options.exact) {
                            return normalizedText === text;
                        } else if (typeof text === 'string') {
                            return normalizedText.includes(text);
                        } else if (text instanceof RegExp) {
                            return text.test(normalizedText);
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

                if (filteredElements.length) return filteredElements;
                if (Date.now() - start >= WAIT_TIMEOUT) return [];
                await new Promise((r) => setTimeout(r, WAIT_INTERVAL));
            }
        },

        /**
         * 根據 Placeholder 文字查找輸入元素。
         * @param {string|RegExp} text - 要查找的 Placeholder 文字，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配 Placeholder 文字。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {NodeListOf<HTMLElement>} - 匹配的輸入元素列表。
         */
        async getByPlaceholder(text, options = {}, parentElement = document) {
            const start = Date.now();
            while (true) {
                const inputs = parentElement.querySelectorAll('input[placeholder], textarea[placeholder]');
                let filteredElements = Array.from(inputs).filter(input => {
                    const placeholderText = input.getAttribute('placeholder');
                    if (options.exact) {
                        return placeholderText === text;
                    } else if (typeof text === 'string') {
                        return placeholderText.includes(text);
                    } else if (text instanceof RegExp) {
                        return text.test(placeholderText);
                    }
                    return false;
                });

                if (filteredElements.length) return filteredElements;
                if (Date.now() - start >= WAIT_TIMEOUT) return [];
                await new Promise((r) => setTimeout(r, WAIT_INTERVAL));
            }
        },

        /**
         * 根據替代文字查找圖像元素。
         * @param {string|RegExp} text - 要查找的替代文字，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配替代文字。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {NodeListOf<HTMLElement>} - 匹配的圖像元素列表。
         */
        async getByAltText(text, options = {}, parentElement = document) {
            const start = Date.now();
            while (true) {
                const elements = parentElement.querySelectorAll('img[alt], area[alt]');
                let filteredElements = Array.from(elements).filter(element => {
                    const altText = element.getAttribute('alt');
                    if (options.exact) {
                        return altText === text;
                    } else if (typeof text === 'string') {
                        return altText.includes(text);
                    } else if (text instanceof RegExp) {
                        return text.test(altText);
                    }
                    return false;
                });

                if (filteredElements.length) return filteredElements;
                if (Date.now() - start >= WAIT_TIMEOUT) return [];
                await new Promise((r) => setTimeout(r, WAIT_INTERVAL));
            }
        },

        /**
         * 根據標題屬性查找元素。
         * @param {string|RegExp} text - 要查找的標題文字，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配標題文字。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {NodeListOf<HTMLElement>} - 匹配的元素列表。
         */
        async getByTitle(text, options = {}, parentElement = document) {
            const start = Date.now();
            while (true) {
                const elements = parentElement.querySelectorAll('[title]');
                let filteredElements = Array.from(elements).filter(element => {
                    const titleText = element.getAttribute('title');
                    if (options.exact) {
                        return titleText === text;
                    } else if (typeof text === 'string') {
                        return titleText.includes(text);
                    } else if (text instanceof RegExp) {
                        return text.test(titleText);
                    }
                    return false;
                });

                if (filteredElements.length) return filteredElements;
                if (Date.now() - start >= WAIT_TIMEOUT) return [];
                await new Promise((r) => setTimeout(r, WAIT_INTERVAL));
            }
        },

        /**
         * 根據測試 ID 查找元素 (支援多種屬性名稱)。
         * @param {string|RegExp} testId - 要查找的測試 ID，可以是字串或正則表達式。
         * @param {object} [options] - 選項。
         * @param {boolean} [options.exact] - 是否精確匹配測試 ID。
         * @param {HTMLElement} [parentElement=document] - 父元素，用於縮小查找範圍。
         * @returns {NodeListOf<HTMLElement>} - 匹配的元素列表。
         */
        async getByTestId(testId, options = {}, parentElement = document) {
            const start = Date.now();
            const testIdAttributes = ['data-testid', 'data-test-id']; // 添加所有可能的屬性名稱

            while (true) {
                let filteredElements = Array.from(parentElement.querySelectorAll('*')).filter(element => {
                    for (const attr of testIdAttributes) {
                        if (element.hasAttribute(attr)) {
                            const attributeValue = element.getAttribute(attr);
                            if (options.exact) {
                                return attributeValue === testId;
                            } else if (typeof testId === 'string') {
                                return attributeValue.includes(testId);
                            } else if (testId instanceof RegExp) {
                                return testId.test(attributeValue);
                            }
                        }
                    }
                    return false;
                });

                if (filteredElements.length) return filteredElements;
                if (Date.now() - start >= WAIT_TIMEOUT) return [];
                await new Promise((r) => setTimeout(r, WAIT_INTERVAL));
            }
        },
    };

    window.page = page;

    // 使用範例
    // (await page.getByRole('button', { name: 'Submit' }))[0]?.click();

})();