import { Plugin, MarkdownPostProcessorContext, Notice } from "obsidian";
import { parse } from "@iarna/toml";

export default class InfoboxPlugin extends Plugin {
	async onload() {
		new Notice("Hello there sister");
		this.registerMarkdownPostProcessor(this.processInfoboxes.bind(this));
	}

	async processInfoboxes(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// Find all code blocks with 'infobox' language
		el.querySelectorAll("pre > code.language-infobox").forEach(
			(codeElement: HTMLElement) => {
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

	snakeCaseToNormal(content: string) {
		return (
			content
				// Replace underscore with a space
				.replace("_", " ")
				// Split the string into an array of words
				.split(" ")
				// Map over the array and capitalize the first letter of each word
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				// Join the array back to a string
				.join(" ")
		);
	}

	parseInfoboxContent(content: string) {
		return parse(content);
		// Assuming the content is a JSON object
		return JSON.parse(content);
	}

	createInfoboxElement(content: any) {
		const div = document.createElement("div");
		div.classList.add("infobox");

		if (content.image !== undefined) {
			const img = document.createElement("img");
			img.src = content.image;
			div.appendChild(img);
		}

		if (content.title !== undefined) {
			const title = document.createElement("h1");
			title.textContent = content.title;
			div.appendChild(title);
		}

		if (Object.keys(content).length <= 2) {
			return div;
		}

		const infoboxContent = document.createElement("div");
		infoboxContent.classList.add("infobox-content");
		div.appendChild(infoboxContent);

		for (const key in content) {
			// Skip if the property is 'img' or 'title'
			if (key === "image" || key === "title") continue;

			// Make sure this is a property of the object, not something from the prototype chain
			if (content.hasOwnProperty(key)) {
				const subDiv = document.createElement("div");
				subDiv.classList.add("subdiv");
				infoboxContent.appendChild(subDiv);

				if (typeof content[key] === "string") {
					const subKey = document.createElement("p");
					subKey.textContent = this.snakeCaseToNormal(key);
					subKey.style.fontWeight = "700";
					subDiv.appendChild(subKey);

					const subContnet = document.createElement("p");
					subContnet.textContent = content[key];
					subContnet.style.width = "50%";
					subDiv.appendChild(subContnet);
				} else if (Array.isArray(content[key])) {
					let list: string[] = content[key];

					const subKey = document.createElement("p");
					subKey.textContent = this.snakeCaseToNormal(key);
					subKey.style.fontWeight = "700";
					subDiv.appendChild(subKey);

					const listDiv = document.createElement("div");
					listDiv.classList.add("listdiv");
					subDiv.appendChild(listDiv);

					list.forEach(element => {
						const subContnet = document.createElement("p");
						subContnet.textContent = element;
						listDiv.appendChild(subContnet);
					});
				}
			}
		}

		return div;
	}
}
