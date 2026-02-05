import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({
  name: 'markdown'
})
export class McitMarkdownPipe implements PipeTransform {
  public transform(markdown: string, options?: marked.MarkedOptions): string {
    if (markdown == null) {
      return '';
    }
    return marked(markdown, options);
  }
}
