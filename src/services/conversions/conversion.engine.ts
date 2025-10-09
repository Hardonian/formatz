/**
 * Conversion Engine
 *
 * Handles the actual data format transformations.
 * Supports JSON, XML, CSV, YAML, TOML, HTML, Markdown, and TXT.
 */

import type { ConversionFormat, TemplateConfiguration } from '../../types/dtos';

export class ConversionEngine {
  /**
   * Convert data from source format to target format
   */
  async convert(
    inputData: string,
    sourceFormat: ConversionFormat,
    targetFormat: ConversionFormat,
    config?: TemplateConfiguration
  ): Promise<string> {
    // Parse source data
    const parsed = await this.parse(inputData, sourceFormat);

    // Transform to target format
    const output = await this.serialize(parsed, targetFormat, config);

    return output;
  }

  /**
   * Parse data from source format to intermediate representation
   */
  private async parse(data: string, format: ConversionFormat): Promise<any> {
    switch (format) {
      case 'json':
        return this.parseJSON(data);
      case 'xml':
        return this.parseXML(data);
      case 'csv':
        return this.parseCSV(data);
      case 'yaml':
        return this.parseYAML(data);
      case 'toml':
        return this.parseTOML(data);
      case 'html':
        return this.parseHTML(data);
      case 'markdown':
        return this.parseMarkdown(data);
      case 'txt':
        return this.parseTXT(data);
      default:
        throw new Error(`Unsupported source format: ${format}`);
    }
  }

  /**
   * Serialize intermediate representation to target format
   */
  private async serialize(
    data: any,
    format: ConversionFormat,
    config?: TemplateConfiguration
  ): Promise<string> {
    switch (format) {
      case 'json':
        return this.serializeJSON(data, config);
      case 'xml':
        return this.serializeXML(data, config);
      case 'csv':
        return this.serializeCSV(data, config);
      case 'yaml':
        return this.serializeYAML(data, config);
      case 'toml':
        return this.serializeTOML(data, config);
      case 'html':
        return this.serializeHTML(data, config);
      case 'markdown':
        return this.serializeMarkdown(data, config);
      case 'txt':
        return this.serializeTXT(data, config);
      default:
        throw new Error(`Unsupported target format: ${format}`);
    }
  }

  // ============================================
  // PARSERS
  // ============================================

  private parseJSON(data: string): any {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  private parseXML(data: string): any {
    // Simple XML parser (in production, use DOMParser or xml2js library)
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');
      return this.xmlToObject(xmlDoc.documentElement);
    } catch (error) {
      throw new Error('Invalid XML format');
    }
  }

  private parseCSV(data: string): any[] {
    const lines = data.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1);

    return rows.map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  }

  private parseYAML(data: string): any {
    // Simple YAML parser (in production, use js-yaml library)
    // This is a simplified version for demonstration
    throw new Error('YAML parsing requires js-yaml library - install with: npm install js-yaml');
  }

  private parseTOML(data: string): any {
    // TOML parser (in production, use @iarna/toml library)
    throw new Error('TOML parsing requires @iarna/toml library - install with: npm install @iarna/toml');
  }

  private parseHTML(data: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    return { html: data, text: doc.body.textContent || '' };
  }

  private parseMarkdown(data: string): any {
    return { markdown: data, text: data };
  }

  private parseTXT(data: string): any {
    return { text: data };
  }

  // ============================================
  // SERIALIZERS
  // ============================================

  private serializeJSON(data: any, config?: TemplateConfiguration): string {
    const indent = config?.prettyPrint ? 2 : 0;
    return JSON.stringify(data, null, indent);
  }

  private serializeXML(data: any, config?: TemplateConfiguration): string {
    const rootElement = config?.rootElement || 'root';
    const includeDeclaration = config?.includeDeclaration !== false;

    let xml = includeDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '';
    xml += this.objectToXML(data, rootElement);

    return xml;
  }

  private serializeCSV(data: any[], config?: TemplateConfiguration): string {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('CSV format requires an array of objects');
    }

    const delimiter = config?.delimiter || ',';
    const includeHeader = config?.includeHeader !== false;

    const headers = Object.keys(data[0]);
    let csv = '';

    if (includeHeader) {
      csv += headers.join(delimiter) + '\n';
    }

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(delimiter)
          ? `"${value}"`
          : value;
      });
      csv += values.join(delimiter) + '\n';
    });

    return csv;
  }

  private serializeYAML(data: any, config?: TemplateConfiguration): string {
    // Simple YAML serializer (in production, use js-yaml library)
    throw new Error('YAML serialization requires js-yaml library - install with: npm install js-yaml');
  }

  private serializeTOML(data: any, config?: TemplateConfiguration): string {
    // TOML serializer (in production, use @iarna/toml library)
    throw new Error('TOML serialization requires @iarna/toml library - install with: npm install @iarna/toml');
  }

  private serializeHTML(data: any, config?: TemplateConfiguration): string {
    if (typeof data === 'object' && 'html' in data) {
      return data.html;
    }

    // Convert data to HTML table
    if (Array.isArray(data)) {
      return this.arrayToHTMLTable(data);
    }

    return `<div>${JSON.stringify(data)}</div>`;
  }

  private serializeMarkdown(data: any, config?: TemplateConfiguration): string {
    if (typeof data === 'object' && 'markdown' in data) {
      return data.markdown;
    }

    // Convert data to Markdown
    if (Array.isArray(data)) {
      return this.arrayToMarkdownTable(data);
    }

    return `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
  }

  private serializeTXT(data: any, config?: TemplateConfiguration): string {
    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'object' && 'text' in data) {
      return data.text;
    }

    return JSON.stringify(data, null, 2);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private xmlToObject(node: Element): any {
    const obj: any = {};

    // Add attributes
    if (node.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj['@attributes'][attr.name] = attr.value;
      }
    }

    // Add child nodes
    const children = Array.from(node.children);
    if (children.length > 0) {
      children.forEach(child => {
        const childObj = this.xmlToObject(child);
        if (obj[child.tagName]) {
          if (!Array.isArray(obj[child.tagName])) {
            obj[child.tagName] = [obj[child.tagName]];
          }
          obj[child.tagName].push(childObj);
        } else {
          obj[child.tagName] = childObj;
        }
      });
    } else {
      // Leaf node - add text content
      obj['_text'] = node.textContent || '';
    }

    return obj;
  }

  private objectToXML(obj: any, tagName: string, level: number = 0): string {
    const indent = '  '.repeat(level);
    let xml = `${indent}<${tagName}`;

    // Add attributes
    if (obj['@attributes']) {
      Object.entries(obj['@attributes']).forEach(([key, value]) => {
        xml += ` ${key}="${value}"`;
      });
    }

    xml += '>';

    // Add content
    if (obj['_text']) {
      xml += obj['_text'];
    } else if (typeof obj === 'object' && !Array.isArray(obj)) {
      xml += '\n';
      Object.entries(obj).forEach(([key, value]) => {
        if (key !== '@attributes' && key !== '_text') {
          if (Array.isArray(value)) {
            value.forEach(item => {
              xml += this.objectToXML(item, key, level + 1);
            });
          } else {
            xml += this.objectToXML(value, key, level + 1);
          }
        }
      });
      xml += indent;
    } else if (Array.isArray(obj)) {
      // Handle array
      xml += '\n';
      obj.forEach(item => {
        xml += this.objectToXML(item, 'item', level + 1);
      });
      xml += indent;
    } else {
      xml += String(obj);
    }

    xml += `</${tagName}>\n`;
    return xml;
  }

  private arrayToHTMLTable(data: any[]): string {
    if (data.length === 0) return '<table></table>';

    const headers = Object.keys(data[0]);
    let html = '<table border="1">\n  <thead>\n    <tr>\n';

    headers.forEach(header => {
      html += `      <th>${header}</th>\n`;
    });

    html += '    </tr>\n  </thead>\n  <tbody>\n';

    data.forEach(row => {
      html += '    <tr>\n';
      headers.forEach(header => {
        html += `      <td>${row[header] || ''}</td>\n`;
      });
      html += '    </tr>\n';
    });

    html += '  </tbody>\n</table>';
    return html;
  }

  private arrayToMarkdownTable(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    let md = '| ' + headers.join(' | ') + ' |\n';
    md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

    data.forEach(row => {
      md += '| ' + headers.map(h => row[h] || '').join(' | ') + ' |\n';
    });

    return md;
  }
}
