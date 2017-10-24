// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  MarkupElement,
  MarkupBasicElement,
  IMarkupWebLink,
  IMarkupApiLink,
  IMarkupText,
  IMarkupParagraph,
  IMarkupLineBreak,
  IMarkupTable,
  IMarkupTableRow,
  IMarkupTableCell,
  IMarkupHeading1,
  IMarkupHeading2,
  IMarkupPage,
  IMarkupHighlightedText,
  MarkupLinkTextElement,
  IMarkupNoteBox,
  IMarkupCodeBox,
  MarkupHighlighter
} from './MarkupElement';

import { IApiItemReference } from '../api/ApiItem';

/**
 * Provides various operations for working with MarkupElement objects.
 *
 * @public
 */
export class Markup {
  /**
   * A predefined constant for the IMarkupLineBreak element.
   */
  public static BREAK: IMarkupLineBreak = {
    kind: 'break'
  };

  /**
   * A predefined constant for the IMarkupParagraph element.
   */
  public static PARAGRAPH: IMarkupParagraph = {
    kind: 'paragraph'
  };

  /**
   * Constructs an IMarkupText element representing the specified text string, with
   * optional formatting.
   *
   * @remarks
   * The return value is represented as an array containing at most one element.
   * Another possible design would be to return a single IMarkupText object that
   * is possibly undefined; however, in practice appending arrays turns out to be
   * more concise than checking for undefined.
   */
  public static createTextElement(text: string, options?: { bold?: boolean, italics?: boolean } ): IMarkupText[] {
    if (!text) {
      return [];
    } else {
      const result: IMarkupText = {
        kind: 'text',
        text: Markup._trimRawText(text)
      } as IMarkupText;

      if (options) {
        if (options.bold) {
          result.bold = true;
        }
        if (options.italics) {
          result.italics = true;
        }
      }

      return [ result ];
    }
  }

  /**
   * Constructs an IMarkupApiLink element that represents a hyperlink to the specified
   * API object.  The hyperlink is applied to an existing stream of markup elements.
   * @param textElements - the markup sequence that will serve as the link text
   * @param target - the API object that the hyperlink will point to
   */
  public static createApiLink(textElements: MarkupLinkTextElement[], target: IApiItemReference): IMarkupApiLink {
    if (!textElements.length) {
      throw new Error('Missing text for link');
    }

    return {
      kind: 'api-link',
      elements: textElements,
      target: target
    } as IMarkupApiLink;
  }

  /**
   * Constructs an IMarkupApiLink element that represents a hyperlink to the specified
   * API object.  The hyperlink is applied to a plain text string.
   * @param text - the text string that will serve as the link text
   * @param target - the API object that the hyperlink will point to
   */
  public static createApiLinkFromText(text: string, target: IApiItemReference): IMarkupApiLink {
    return Markup.createApiLink(Markup.createTextElements(text), target);
  }

  /**
   * Constructs an IMarkupWebLink element that represents a hyperlink an internet URL.
   * @param textElements - the markup sequence that will serve as the link text
   * @param targetUrl - the URL that the hyperlink will point to
   */
  public static createWebLink(textElements: MarkupLinkTextElement[], targetUrl: string): IMarkupWebLink {
    if (!textElements.length) {
      throw new Error('Missing text for link');
    }
    if (!targetUrl || !targetUrl.trim()) {
      throw new Error('Missing link target');
    }

    return {
      kind: 'web-link',
      elements: textElements,
      targetUrl: targetUrl
    };
  }

  /**
   * Constructs an IMarkupWebLink element that represents a hyperlink an internet URL.
   * @param text - the plain text string that will serve as the link text
   * @param targetUrl - the URL that the hyperlink will point to
   */
  public static createWebLinkFromText(text: string, targetUrl: string): IMarkupWebLink {
    return Markup.createWebLink(Markup.createTextElements(text), targetUrl);
  }

  /**
   * Constructs an IMarkupHighlightedText element representing a program code text
   * with optional syntax highlighting
   */
  public static createCode(code: string, highlighter?: MarkupHighlighter): IMarkupHighlightedText {
    if (!code) {
      throw new Error('The code parameter is missing');
    }
    return {
      kind: 'code',
      text: code,
      highlighter: highlighter || 'plain'
    } as IMarkupHighlightedText;
  }

  /**
   * Constructs an IMarkupHeading1 element with the specified title text
   */
  public static createHeading1(text: string): IMarkupHeading1 {
    return {
      kind: 'heading1',
      text: Markup._trimRawText(text)
    };
  }

  /**
   * Constructs an IMarkupHeading2 element with the specified title text
   */
  public static createHeading2(text: string): IMarkupHeading2 {
    return {
      kind: 'heading2',
      text: Markup._trimRawText(text)
    };
  }

  /**
   * Constructs an IMarkupCodeBox element representing a program code text
   * with the specified syntax highlighting
   */
  public static createCodeBox(code: string, highlighter: MarkupHighlighter): IMarkupCodeBox {
    if (!code) {
      throw new Error('The code parameter is missing');
    }
    return {
      kind: 'code-box',
      text: code,
      highlighter: highlighter
    } as IMarkupCodeBox;
  }

  /**
   * Constructs an IMarkupNoteBox element that will display the specified markup content
   */
  public static createNoteBox(textElements: MarkupBasicElement[]): IMarkupNoteBox {
    return {
      kind: 'note-box',
      elements: textElements
    } as IMarkupNoteBox;
  }

  /**
   * Constructs an IMarkupNoteBox element that will display the specified plain text string
   */
  public static createNoteBoxFromText(text: string): IMarkupNoteBox {
    return Markup.createNoteBox(Markup.createTextElements(text));
  }

  /**
   * Constructs an IMarkupTableRow element containing the specified cells, which each contain a
   * sequence of MarkupBasicElement content
   */
  public static createTableRow(cellValues: MarkupBasicElement[][] | undefined = undefined): IMarkupTableRow {
    const row: IMarkupTableRow = {
      kind: 'table-row',
      cells: []
    };

    if (cellValues) {
      for (const cellValue of cellValues) {
        const cell: IMarkupTableCell = {
          kind: 'table-cell',
          elements: cellValue
        };
        row.cells.push(cell);
      }
    }

    return row;
  }

  /**
   * Constructs an IMarkupTable element containing the specified header cells, which each contain a
   * sequence of MarkupBasicElement content.
   * @remarks
   * The table initially has zero rows.
   */
  public static createTable(headerCellValues: MarkupBasicElement[][] | undefined = undefined): IMarkupTable {
    let header: IMarkupTableRow | undefined = undefined;
    if (headerCellValues) {
      header = Markup.createTableRow(headerCellValues);
    }
    return {
      kind: 'table',
      header: header,
      rows: []
    } as IMarkupTable;
  }

  /**
   * Constructs an IMarkupTable element with the specified title.
   */
  public static createPage(title: string): IMarkupPage {
    return {
      kind: 'page',
      breadcrumb: [],
      title: Markup._trimRawText(title),
      elements: []
    } as IMarkupPage;
  }

  /**
   * Extracts plain text from the provided markup elements, discarding any formatting.
   *
   * @remarks
   * The returned string is suitable for counting words or extracting search keywords.
   * Its formatting is not guaranteed, and may change in future updates of this API.
   *
   * API Extractor determines whether an API is "undocumented" by using extractTextContent()
   * to extract the text from its summary, and then counting the number of words.
   */
  public static extractTextContent(elements: MarkupElement[]): string {
    // Pass a buffer, since "+=" uses less memory than "+"
    const buffer: { text: string } = { text: '' };
    Markup._extractTextContent(elements, buffer);
    return buffer.text;
  }

  private static _extractTextContent(elements: MarkupElement[], buffer: { text: string }): void {
    for (const element of elements) {
      switch (element.kind) {
        case 'api-link':
          buffer.text += Markup.extractTextContent(element.elements);
          break;
        case 'break':
          buffer.text += '\n';
          break;
        case 'code':
        case 'code-box':
          break;
        case 'heading1':
        case 'heading2':
          buffer.text += element.text;
          break;
        case 'note-box':
          buffer.text += Markup.extractTextContent(element.elements);
          break;
        case 'page':
          buffer.text += element.title + '\n';
          buffer.text += Markup.extractTextContent(element.elements);
          break;
        case 'paragraph':
          buffer.text += '\n\n';
          break;
        case 'table':
          buffer.text += Markup.extractTextContent([element.header])
            + Markup.extractTextContent(element.rows);
          break;
        case 'table-cell':
          buffer.text += Markup.extractTextContent(element.elements);
          buffer.text += '\n';
          break;
        case 'table-row':
          buffer.text += Markup.extractTextContent(element.cells);
          buffer.text += '\n';
          break;
        case 'text':
          buffer.text += element.text;
          break;
        case 'web-link':
          buffer.text += Markup.extractTextContent(element.elements);
          break;
        default:
          throw new Error('Unsupported element kind');
      }
    }
  }

  private static _trimRawText(text: string): string {
    // Replace multiple whitespaces with a single space
    return text.replace(/\s+/g, ' ');
  }
}
