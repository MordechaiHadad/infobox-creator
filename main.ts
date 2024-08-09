import { Plugin, MarkdownPostProcessorContext } from "obsidian";
import { JsonMap, parse } from "@iarna/toml";

interface parsedUrl {
	type: "internal" | "external";
	url: string;
}

export default class InfoboxPlugin extends Plugin {
	async onload() {
		console.log("Loading infobox-creator");
		this.registerMarkdownCodeBlockProcessor(
			"infobox",
			this.processInfoboxes.bind(this)
		);
	}

	async unload() {
		console.log("Unloading infobox-creator, bye bye!");
	}

	processInfoboxes(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		const infoboxContent = this.parseInfoboxContent(source);
		const infoboxElement = this.createInfoboxElement(infoboxContent, ctx);
		el.replaceWith(infoboxElement);
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

	parseInfoboxContent(content: string): JsonMap {
		return parse(content);
	}

	createInfoboxElement(content: any, ctx: MarkdownPostProcessorContext) {
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

		let remainingKeys = Object.keys(content).filter(
			(key) => key !== "image" && key !== "title"
		);

		if (remainingKeys.length === 0) {
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
					console.log(key);
					subKey.textContent = this.snakeCaseToNormal(key);
					subKey.classList.add("title");
					subDiv.appendChild(subKey);

					const subContnet = document.createElement("p");
					let contentString = content[key];

					const interalLinkRegex = /\[\[.*?\]\]/; // Regex pattern to match [[Some String]]

					const parts = contentString
						.split(/(\[\[.*?\]\])| /)
						.filter(Boolean);
					let textBuffer = "";

					parts.forEach((part: string, index: number) => {
						console.log(part, interalLinkRegex.test(part));
						if (interalLinkRegex.test(part)) {
							// Append buffered text as a single text node
							if (textBuffer) {
								const textNode = document.createTextNode(
									textBuffer + " "
								);
								subContnet.appendChild(textNode);
								textBuffer = "";
							}
							// Append the anchor element
							const matchElement = this.generateAElementFromUrl(
								part,
								ctx
							);
							subContnet.appendChild(matchElement);
							subContnet.appendChild(
								document.createTextNode(" ")
							);
						} else {
							// Accumulate text parts in the buffer
							textBuffer += part + " ";
						}

						// If it's the last part, append any remaining text in the buffer
						if (index === parts.length - 1 && textBuffer) {
							const textNode =
								document.createTextNode(textBuffer);
							subContnet.appendChild(textNode);
						}
					});

					subContnet.classList.add("content");
					subDiv.appendChild(subContnet);
				} else if (Array.isArray(content[key])) {
					let list: string[] = content[key];

					const subKey = document.createElement("p");
					subKey.textContent = this.snakeCaseToNormal(key);
					subKey.classList.add("title");
					subDiv.appendChild(subKey);

					const listDiv = document.createElement("div");
					listDiv.classList.add("listdiv");
					subDiv.appendChild(listDiv);

					list.forEach((element) => {
						const subContnet = document.createElement("p");
						subContnet.textContent = element;
						listDiv.appendChild(subContnet);
					});
				} else if (typeof content[key] == "object") {
					if ("link" in content[key]) {
						const subKey = document.createElement("p");
						subKey.textContent = this.snakeCaseToNormal(key);
						subKey.classList.add("title");
						subDiv.appendChild(subKey);

						const subContnet = this.generateAElementFromUrl(
							content[key].content,
							ctx
						);
						subContnet.classList.add("content");
						subDiv.appendChild(subContnet);
					}
				}
			}
		}

		return div;
	}

	parseUrl(link: string, sourcePath: string): parsedUrl {
		if (!/\[\[(.*?)(\|(.*?))?\]\]/.test(link)) {
			let parsedurl: parsedUrl = { type: "external", url: link };
			return parsedurl;
		}

		let linkpath = link.slice(2, -2);

		let file = this.app.metadataCache.getFirstLinkpathDest(
			linkpath,
			sourcePath
		);

		let parsedurl: parsedUrl = { type: "internal", url: file!.path };
		return parsedurl;
	}

	generateAElementFromUrl(
		url: string,
		ctx: MarkdownPostProcessorContext
	): HTMLAnchorElement {
		const element = document.createElement("a");
		element.textContent = url.replace(/\[|\]/g, "");

		let parsedUrl = this.parseUrl(url, ctx.sourcePath);
		element.href = parsedUrl.url;
		if (parsedUrl.type === "internal") {
			element.addClass("internal-link");
		}

		return element;
	}
}
