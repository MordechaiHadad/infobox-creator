import { Plugin, MarkdownPostProcessorContext, Notice } from "obsidian";

export default class InfoboxPlugin extends Plugin {
	async onload() {
		new Notice("Hello there sister");
		this.registerMarkdownPostProcessor(this.processInfoboxes.bind(this));
	}

	async processInfoboxes(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// Find all code blocks with 'infobox' language
		el.querySelectorAll("pre > code.language-infobox").forEach(
			(codeElement: HTMLElement) => {
				new Notice("Hello there");
				// Parse the infobox content
				if (codeElement.textContent !== null) {
					const infoboxContent = this.parseInfoboxContent(
						codeElement.textContent
					);
					const infoboxElement =
						this.createInfoboxElement(infoboxContent);
					codeElement.replaceWith(infoboxElement);
				}
			}
		);
	}

	parseInfoboxContent(content: string) {
		// Assuming the content is a JSON object
		return JSON.parse(content);
	}

	createInfoboxElement(content: any) {
		new Notice(content);
		const div = document.createElement("div");
		div.classList.add("infobox");

		const img = document.createElement("img");
		img.src = content.image;
		div.appendChild(img);
		
		const name = document.createElement("h2");
		name.textContent = content.name;
		div.appendChild(name);

		return div;
	}
}
