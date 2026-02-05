const path = require('path');
import { test, expect, sendHighlightMessage, expectHighlightSpan, selectTextInElement } from './fixtures';

test.describe('Chrome Extension Tests', () => {
  test('텍스트 선택 후 컨텍스트 메뉴로 노란색 하이라이트 적용 - Apply yellow highlight via context menu after selecting text', async ({page, background}) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const paragraph = page.locator('p:has-text("This is a sample paragraph")');
    const textToSelect = "This is a sample paragraph";

    // p 태그 내에서 textToSelect 문자열을 찾아 선택합니다. - Find and select textToSelect within the p tag.
    await selectTextInElement(paragraph, textToSelect);

    // 선택된 텍스트가 있는지 확인 (디버깅용) - Check selected text (for debugging)
    const selected = await page.evaluate(() => window.getSelection().toString());
    expect(selected).toBe(textToSelect);

    await sendHighlightMessage(background, 'yellow');

    // 검증 함수 정의 - Define verification function
    const verifyHighlight = async () => {
      const highlightedSpan = page.locator(`span.text-highlighter-extension:has-text("${textToSelect}")`);
      await expectHighlightSpan(highlightedSpan, { color: 'rgb(255, 255, 0)', text: textToSelect });
    };
    await verifyHighlight(); // 하이라이트 직후 - Immediately after highlight
    await page.reload();
    await verifyHighlight(); // 리프레시 후 - After refresh
  });

  test('첫 번째 단락 전체를 트리플 클릭하여 초록색으로 하이라이트 - Triple-click the entire first paragraph to highlight in green', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const firstParagraph = page.locator('p').first();
    const expectedText = "This is a sample paragraph with some text that can be highlighted.";

    await firstParagraph.click({ clickCount: 3 });

    const selectedText = await page.evaluate(() => {
      const selection = window.getSelection();
      return selection ? selection.toString().trim() : '';
    });
    expect(selectedText).toBe(expectedText);

    await sendHighlightMessage(background, '#AAFFAA'); // Green color 

    // 검증 함수 정의 - Define verification function
    const verifyHighlight = async () => {
      const highlightedSpan = firstParagraph.locator('span.text-highlighter-extension');
      await expectHighlightSpan(highlightedSpan, { color: 'rgb(170, 255, 170)', text: expectedText });
    };
    await verifyHighlight();
    await page.reload();
    await verifyHighlight();
  });

  test('동적으로 생성된 멀티 텍스트 노드 단락을 트리플 클릭하여 하이라이트 - 전체 텍스트 하이라이트 및 단일 하이라이트 생성 확인 - Triple-click a dynamically created multi-text-node paragraph to highlight - verify full-text highlight and single highlight creation', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const multiTextParagraph = page.locator('#dynamic-multi-text');
    const expectedText = "first second third";

    await page.waitForFunction(() => {
      const elem = document.getElementById('dynamic-multi-text');
      return elem && elem.childNodes.length > 1; // 멀티 텍스트 노드가 생성되었는지 확인 - Check that multi text nodes were created
    });

    const textNodeCount = await multiTextParagraph.evaluate((element) => {
      return Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).length;
    });
    expect(textNodeCount).toBeGreaterThan(1); 

    await multiTextParagraph.click({ clickCount: 3 });

    const selectedText = await page.evaluate(() => {
      const selection = window.getSelection();
      return selection ? selection.toString().trim() : '';
    });
    expect(selectedText).toBe(expectedText);

    await sendHighlightMessage(background, '#FFAAFF'); // Purple color

    // Assert that all text in the paragraph is highlighted
    // 검증 함수 정의 - Define verification function
    const verifyHighlight = async () => {
      const highlightedSpans = multiTextParagraph.locator('span.text-highlighter-extension');
      await expect(highlightedSpans).toHaveCount(3);
    };
    await verifyHighlight();
    await page.reload();
    await verifyHighlight();
  });

  test('h1과 첫 번째 p 태그의 텍스트를 모두 선택 후 하이라이트 적용 - Select text in h1 and the first p tag and apply highlight', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const h1 = page.locator('h1');
    const firstParagraph = page.locator('p').first();
    const h1Text = await h1.textContent();
    const pText = await firstParagraph.textContent();
    const totalText = (h1Text + '\n' + pText).trim();

    await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const p = document.querySelector('p');
      if (!h1 || !p) throw new Error('h1 또는 p 태그를 찾을 수 없습니다. - Could not find h1 or p tag.');
      const h1TextNode = Array.from(h1.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      const pTextNode = Array.from(p.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      if (!h1TextNode || !pTextNode) throw new Error('텍스트 노드를 찾을 수 없습니다. - Could not find text nodes.');
      const range = document.createRange();
      range.setStart(h1TextNode, 0);
      range.setEnd(pTextNode, pTextNode.textContent.length);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    const selected = await page.evaluate(() => window.getSelection().toString().replace(/\r?\n/g, '\n').trim());
    expect(selected).toBe(totalText);

    await sendHighlightMessage(background, 'yellow');

    // 검증 함수 정의 - Define verification function
    const verifyHighlight = async () => {
      const h1Span = h1.locator('span.text-highlighter-extension');
      const pSpan = firstParagraph.locator('span.text-highlighter-extension');
      await expectHighlightSpan(h1Span, { color: 'rgb(255, 255, 0)', text: h1Text });
      await expectHighlightSpan(pSpan, { color: 'rgb(255, 255, 0)', text: pText });
    };
    await verifyHighlight();
    await page.reload();
    await verifyHighlight();
  });

  test('id가 "inline-element"인 단락에서 "This has <strong>inline" 텍스트를 선택 후 하이라이트 동작 검증 - Verify highlight after selecting "This has <strong>inline" text in paragraph with id "inline-element"', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const inlineParagraph = page.locator('#inline-element');
    // "This has "는 텍스트 노드, "inline"은 strong 태그 내부 - "This has " is a text node, "inline" is inside the strong tag
    // strong 태그의 첫 번째 자식 노드가 "inline element" 텍스트임 - The first child node of strong contains the "inline element" text
    await page.evaluate(() => {
      const p = document.getElementById('inline-element');
      if (!p) throw new Error('Could not find the paragraph with id "inline-element".');
      const textNode = Array.from(p.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.includes('This has'));
      const strong = p.querySelector('strong');
      if (!textNode || !strong) throw new Error('Could not find the text node or <strong> element.');
      const strongTextNode = strong.firstChild;
      // "This has " 길이: 9, strong 내부 "inline" 길이: 6 - "This has " length: 9, "inline" length inside strong: 6
      const range = document.createRange();
      range.setStart(textNode, 0); // "This has "의 처음 - start of "This has "
      range.setEnd(strongTextNode, 6); // strong 내부 "inline"까지 - up to "inline" inside strong
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // 선택된 텍스트가 "This has inline"인지 확인 - Verify selected text is "This has inline"
    const selected = await page.evaluate(() => window.getSelection().toString());
    expect(selected).toBe('This has inline');

    await sendHighlightMessage(background, '#FFFF99'); // 연노랑 - light yellow

    // 검증 함수 정의 - Define verification function
    const verifyHighlight = async () => {
      const highlightedSpans = inlineParagraph.locator('span.text-highlighter-extension');
      await expect(highlightedSpans).toHaveCount(2);
      await expectHighlightSpan(highlightedSpans.nth(0), { color: 'rgb(255, 255, 153)', text: 'This has ' });
      await expectHighlightSpan(highlightedSpans.nth(1), { color: 'rgb(255, 255, 153)', text: 'inline' });
    };
    await verifyHighlight();
    await page.reload();
    await verifyHighlight();
  });

  test('id가 "inline-element"인 단락에서 "element</strong> in text." 텍스트를 선택 후 하이라이트 동작 검증 - Verify highlight after selecting "element</strong> in text." in paragraph with id "inline-element"', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const inlineParagraph = page.locator('#inline-element');
    // strong 태그 내부 "element"와 strong 태그 뒤 텍스트 노드 " in text."를 선택 - Select "element" inside strong and the following text node " in text."
    await page.evaluate(() => {
      const p = document.getElementById('inline-element');
      const strong = p.querySelector('strong');
      const strongTextNode = strong.firstChild;
      const afterStrongNode = strong.nextSibling;
      const text = strongTextNode.textContent;
      const startIdx = text.indexOf('element');
      if (startIdx === -1) throw new Error('"element" not found in strongTextNode.');
      const range = document.createRange();
      range.setStart(strongTextNode, startIdx); // strong 내부 "element"의 시작 - start of "element" inside strong
      range.setEnd(afterStrongNode, afterStrongNode.textContent.length); // " in text."의 끝 - end of " in text."
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // 선택된 텍스트가 "element in text."인지 확인 - Verify selected text is "element in text."
    const selected = await page.evaluate(() => window.getSelection().toString());
    expect(selected).toBe('element in text.');

    await sendHighlightMessage(background, '#99FFCC'); // 연녹색 - light green

    // 검증 함수 정의 - Define verification function
    const verifyHighlight = async () => {
      const highlightedSpans = inlineParagraph.locator('span.text-highlighter-extension');
      await expect(highlightedSpans).toHaveCount(2);
      await expectHighlightSpan(highlightedSpans.nth(0), { color: 'rgb(153, 255, 204)', text: 'element' });
      await expectHighlightSpan(highlightedSpans.nth(1), { color: 'rgb(153, 255, 204)', text: ' in text.' });
    };
    await verifyHighlight();
    await page.reload();
    await verifyHighlight();
  });

  test('h1 태그 tripple click 하이라이트 및 삭제 - Highlight and delete via triple-click on h1 tag', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const h1 = page.locator('h1');
    const h1Text = await h1.textContent();

    await h1.click({ clickCount: 3 });
    const selected = await page.evaluate(() => window.getSelection().toString().trim());
    expect(selected).toBe(h1Text.trim());

    await sendHighlightMessage(background, 'yellow');

    const h1Span = h1.locator('span.text-highlighter-extension');
    await expectHighlightSpan(h1Span, { color: 'rgb(255, 255, 0)', text: h1Text });

    await h1Span.click();
    const controls = page.locator('.text-highlighter-controls');
    await expect(controls).toBeVisible();
    await expect(controls).toHaveCSS('display', /flex|block/);

    const deleteBtn = controls.locator('.delete-highlight');
    await deleteBtn.click();

    await expect(h1Span).toHaveCount(0);

    // 페이지 리프레시 후 하이라이트가 삭제된 상태 유지 검증 - Verify highlight remains deleted after page refresh
    await page.reload();
    const h1SpanAfterReload = h1.locator('span.text-highlighter-extension');
    await expect(h1SpanAfterReload).toHaveCount(0);
  });

  test('h1 태그 tripple click 하이라이트 후 highlight control UI에서 색상 변경 - Change color in highlight control UI after triple-click highlight on h1', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const h1 = page.locator('h1');
    const h1Text = await h1.textContent();

    await h1.click({ clickCount: 3 });
    const selected = await page.evaluate(() => window.getSelection().toString().trim());
    expect(selected).toBe(h1Text.trim());

    await sendHighlightMessage(background, 'yellow');

    const h1Span = h1.locator('span.text-highlighter-extension');
    await expectHighlightSpan(h1Span, { color: 'rgb(255, 255, 0)', text: h1Text });

    // 하이라이트된 텍스트 클릭 → highlight control UI 표시 - Click highlighted text to show highlight control UI
    await h1Span.click();
    const controls = page.locator('.text-highlighter-controls');
    await expect(controls).toBeVisible();
    await expect(controls).toHaveCSS('display', /flex|block/);

    // highlight control UI의 green 색상 버튼 클릭 - Click green color button in highlight control UI
    // green 색상 버튼은 두 번째 버튼에 위치함 - The green button is the second button
    const greenBtn = controls.locator('.text-highlighter-color-buttons > .text-highlighter-control-button').nth(1);
    await greenBtn.click();

    await expectHighlightSpan(h1Span, { color: 'rgb(170, 255, 170)', text: h1Text });

    // 페이지 리프레시 후 하이라이트 유지 검증 - Verify highlight persists after page refresh
    await page.reload();
    const h1SpanAfterReload = h1.locator('span.text-highlighter-extension');
    await expectHighlightSpan(h1SpanAfterReload, { color: 'rgb(170, 255, 170)', text: h1Text });
  });

  test('selection range의 common ancestor와 end container 가 같은 경우 - When selection range common ancestor and end container are the same', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page2.html')}`);

    const paragraph = page.locator('p');
    const firstLine = 'First line';
    // selection range의 common ancestor와 end container 가 같은 경우 시뮬레이션 - Simulate when common ancestor and end container are the same
    await paragraph.evaluate((p) => {
      // 첫 번째 텍스트 노드 찾기 - Find the first text node
      const firstTextNode = Array.from(p.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      if (!firstTextNode) throw new Error('첫 번째 텍스트 노드를 찾을 수 없습니다. - Could not find the first text node.');
      const range = document.createRange();
      range.setStart(firstTextNode, 0);
      range.setEnd(p, 2); // <br> 태그 2개 전까지 - Up to two <br> tags before the end
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // 선택된 텍스트가 "First line"인지 확인 - Verify selected text is "First line"
    const selected = await page.evaluate(() => window.getSelection().toString().trim());
    expect(selected).toBe(firstLine);

    await sendHighlightMessage(background, 'yellow');

    // 검증 함수 정의 - Define verification function
    const verifyHighlight = async () => {
      const highlightedSpans = paragraph.locator('span.text-highlighter-extension');
      await expect(highlightedSpans).toHaveCount(1);
      const highlightedText = await highlightedSpans.first().textContent();
      expect(highlightedText.trim()).toBe(firstLine);
      await expectHighlightSpan(highlightedSpans.first(), { color: 'rgb(255, 255, 0)', text: firstLine });
    };
    await verifyHighlight();

    // 페이지 리프레시 후 하이라이트 유지 검증 - Verify highlight persists after page refresh
    await page.reload();
    const highlightedSpansAfterReload = paragraph.locator('span.text-highlighter-extension');
    await verifyHighlight();
  });

  test('selection range의 common ancestor와 end container 가 같은 경우 2 - Same common ancestor and end container case 2', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page3.html')}`);

    // selection range의 common ancestor와 end container 가 같은 경우 시뮬레이션 - Simulate when common ancestor and end container are the same
    await page.evaluate(() => {
      const container = document.querySelector('div.section-content.blog-article.card');
      const p = container.querySelector('p');
      const textNode = Array.from(p.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      if (!textNode) throw new Error('텍스트 노드를 찾을 수 없습니다. - Could not find text node.');
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(container, 13); // endOffset: 13
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // 선택된 텍스트가 "I wrote."인지 확인 - Verify selected text is "I wrote."
    const selected = await page.evaluate(() => window.getSelection().toString().trim());
    expect(selected).toBe('I wrote.');

    await sendHighlightMessage(background, 'yellow');

    // 검증 함수 정의 - Define verification function
    const verifyHighlight = async () => {
      const highlightedSpans = page.locator('p span.text-highlighter-extension');
      await expect(highlightedSpans).toHaveCount(1);
      const highlightedText = await highlightedSpans.first().textContent();
      expect(highlightedText.trim()).toBe('I wrote.');
      await expectHighlightSpan(highlightedSpans.first(), { color: 'rgb(255, 255, 0)', text: 'I wrote.' });
    };
    await verifyHighlight();

    // 페이지 리프레시 후 하이라이트 유지 검증 - Verify highlight persists after page refresh
    await page.reload();
    const highlightedSpansAfterReload = page.locator('p span.text-highlighter-extension');
    await verifyHighlight();
  });

  test('p 태그 트리플 클릭 후 노란색 하이라이트, 새로고침 후 p 태그 안의 "in"만 하이라이트 유지, h1의 "in"은 하이라이트되지 않아야 함 (test-page4.html) - Triple-click p to highlight yellow, after refresh only "in" in p stays highlighted and "in" in h1 should not be highlighted (test-page4.html)', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page4.html')}`);

    const paragraph = page.locator('p');
    const h1 = page.locator('h1');
    const expectedText = 'test text in paragraph';

    // 트리플 클릭으로 전체 단락 선택 - Select entire paragraph by triple-clicking
    await paragraph.click({ clickCount: 3 });

    // 선택된 텍스트가 전체 단락인지 확인 - Verify selected text is the full paragraph
    const selectedText = await page.evaluate(() => {
      const selection = window.getSelection();
      return selection ? selection.toString().replace(/\s+/g, ' ').trim() : '';
    });
    expect(selectedText).toBe(expectedText);

    // 노란색 하이라이트 명령 실행 - Execute yellow highlight command
    await sendHighlightMessage(background, 'yellow');

    // 페이지 리프레시 - Page refresh
    await page.reload();

    // p 태그 안의 "in"만 하이라이트되어 있는지 확인 - Verify only "in" inside p is highlighted
    // 1. p 태그 내에서 하이라이트된 span 중 "in" 텍스트를 찾음 - Find "in" text among highlighted spans in p
    const inSpanInP = paragraph.locator('span.text-highlighter-extension', { hasText: 'in' });
    await expect(inSpanInP).toHaveCount(1);
    await expectHighlightSpan(inSpanInP, { color: 'rgb(255, 255, 0)', text: ' in ' });

    // 2. h1 태그 내 "in" 텍스트는 span.text-highlighter-extension이 없어야 함 - Ensure no highlight span for "in" in h1
    const inSpanInH1 = h1.locator('span.text-highlighter-extension', { hasText: 'in' });
    await expect(inSpanInH1).toHaveCount(0);
  });

  test('h1 태그 하이라이트 후 highlight control UI에서 커스텀 색상 추가 및 변경 - Add and change custom color in highlight control UI after h1 highlight', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const h1 = page.locator('h1');
    const h1Text = await h1.textContent();

    // 하이라이트 적용을 위해 h1 전체 선택 - Select entire h1 to apply highlight
    await h1.click({ clickCount: 3 });

    const selectedText = await page.evaluate(() => window.getSelection().toString().trim());
    expect(selectedText).toBe(h1Text.trim());

    // 기본 노란색 하이라이트 적용 - Apply default yellow highlight
    await sendHighlightMessage(background, 'yellow');

    const h1Span = h1.locator('span.text-highlighter-extension');
    await expectHighlightSpan(h1Span, { color: 'rgb(255, 255, 0)', text: h1Text });

    // 하이라이트 클릭 → 컨트롤 UI 표시 - Click highlight to show control UI
    await h1Span.click();
    const controls = page.locator('.text-highlighter-controls');
    await expect(controls).toBeVisible();

    // '+' 버튼 클릭하여 커스텀 색상 피커 열기 - Click '+' to open custom color picker
    const addColorBtn = controls.locator('.add-color-button');
    await addColorBtn.click();
    
    // 커스텀 색상 피커가 나타날 때까지 대기 - Wait for custom color picker to appear
    const customColorPicker = page.locator('.custom-color-picker');
    await expect(customColorPicker).toBeVisible();
    
    // 원하는 색상의 프리셋 클릭 (cyan에 가까운 색상 선택) - Click the preset for the desired color (near cyan)
    const newColorHex = '#4ECDC4'; // 프리셋에서 사용 가능한 cyan 계열 색상 - Cyan-ish preset available
    await customColorPicker.locator(`[data-color="${newColorHex}"]`).click();

    // 컨트롤 UI가 새 색상 버튼을 생성할 때까지 대기 - Wait for control UI to create the new color button
    const newColorRgb = 'rgb(78, 205, 196)'; // #4ECDC4의 RGB 값 - RGB value of #4ECDC4
    await page.waitForFunction((rgb) => {
      const controls = document.querySelector('.text-highlighter-controls');
      return Array.from(controls.querySelectorAll('.color-button')).some(b => getComputedStyle(b).backgroundColor === rgb);
    }, newColorRgb);

    // 새 색상 버튼 클릭 - Click new color button
    await page.evaluate((rgb) => {
      const controls = document.querySelector('.text-highlighter-controls');
      const btn = Array.from(controls.querySelectorAll('.color-button')).find(b => getComputedStyle(b).backgroundColor === rgb);
      if (btn) btn.click();
    }, newColorRgb);

    // 색상 변경 확인 - Verify color change
    await expectHighlightSpan(h1Span, { color: newColorRgb, text: h1Text });

    // 새로고침 후에도 색상 유지되는지 확인 - Verify color persists after refresh
    await page.reload();
    const h1SpanAfterReload = page.locator('h1 span.text-highlighter-extension');
    await expectHighlightSpan(h1SpanAfterReload, { color: newColorRgb, text: h1Text });
  });

  test('이미 하이라이트된 텍스트의 일부를 다시 하이라이트하면 중첩되지 않아야 함 - Re-highlighting part of an existing highlight should not create nesting', async ({ page, background }) => {
    await page.goto(`file:///${path.join(__dirname, 'test-page.html')}`);

    const paragraph = page.locator('p').first();
    const initialText = "This is a sample paragraph";
    const overlappingText = "sample";

    // 1. "This is a sample paragraph"를 선택하고 노란색으로 하이라이트 - Select "This is a sample paragraph" and highlight yellow
    await selectTextInElement(paragraph, initialText);

    await sendHighlightMessage(background, 'yellow');

    // 2. 하이라이트가 1개 생성되었는지 확인 - Verify one highlight was created
    const highlightedSpan = paragraph.locator('span.text-highlighter-extension');
    await expect(highlightedSpan).toHaveCount(1);
    await expectHighlightSpan(highlightedSpan, { color: 'rgb(255, 255, 0)', text: initialText });

    // 3. 기존 하이라이트 내부의 "sample" 텍스트를 다시 선택 - Re-select "sample" text inside existing highlight
    await selectTextInElement(highlightedSpan, overlappingText);

    // 4. 다시 하이라이트 명령 실행 (초록색으로) - Run highlight command again (green)
    await sendHighlightMessage(background, 'green');

    // 5. 중첩된 하이라이트가 생성되지 않았는지 확인 (span 개수는 여전히 1개여야 함) - Ensure no nested highlight (span count remains 1)
    const allSpans = paragraph.locator('span.text-highlighter-extension');
    await expect(allSpans).toHaveCount(1);

    // 6. 기존 하이라이트의 색상이나 내용이 변경되지 않았는지 확인 - Ensure existing highlight color/text unchanged
    await expectHighlightSpan(highlightedSpan, { color: 'rgb(255, 255, 0)', text: initialText });
  });

});
