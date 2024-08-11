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
			this.processInfoboxes.bind(this),
		);
	}

	async unload() {
		console.log("Unloading infobox-creator, bye bye!");
	}

	processInfoboxes(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
	) {
		const infoboxContent = this.parseInfoboxContent(source);
		const infoboxElement = this.createInfoboxElement(infoboxContent, ctx);
		el.replaceWith(infoboxElement);
	}

	snakeCaseToNormal(content: string): string {
		return content
			.replace(/_/g, " ")
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	parseInfoboxContent(content: string): JsonMap {
		return parse(content);
	}

	createInfoboxElement(content: any, ctx: MarkdownPostProcessorContext) {
		const div = document.createElement("div");
		div.classList.add("infobox");

		if (content.image) {
			const img = document.createElement("img");
			img.src = content.image;
			div.appendChild(img);
		}

		if (content.title) {
			const title = document.createElement("h1");
			title.textContent = content.title;
			div.appendChild(title);
		} else if (!content.title && Object.keys(content).length > 0) {
			const filePath = ctx.sourcePath;
			const noteName = filePath.substring(
				filePath.lastIndexOf("/") + 1,
				filePath.lastIndexOf("."),
			);

			const title = document.createElement("h1");
			title.textContent = noteName;
			div.appendChild(title);
		}

		let remainingKeys = Object.keys(content).filter(
			(key) => key !== "image" && key !== "title",
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
				const fieldDiv = document.createElement("div");
				fieldDiv.classList.add("field-div");
				infoboxContent.appendChild(fieldDiv);

				if (typeof content[key] === "string") {
					const subKey = document.createElement("p");
					subKey.textContent = this.snakeCaseToNormal(key);
					subKey.classList.add("title");
					fieldDiv.appendChild(subKey);

					const subContnet = document.createElement("p");
					let contentString = content[key];

					const interalLinkRegex = /\[\[.*?\]\]/; // Regex pattern to match [[Some String]]

					const parts = contentString
						.split(/(\[\[.*?\]\])| /)
						.filter(Boolean);
					let textBuffer = "";

					parts.forEach((part: string, index: number) => {
						if (interalLinkRegex.test(part)) {
							// Append buffered text as a single text node
							if (textBuffer) {
								const textNode = document.createTextNode(
									textBuffer + " ",
								);
								subContnet.appendChild(textNode);
								textBuffer = "";
							}
							// Append the anchor element
							const matchElement = this.generateAElementFromUrl(
								part,
								ctx,
							);
							subContnet.appendChild(matchElement);
							subContnet.appendChild(
								document.createTextNode(" "),
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

					fieldDiv.appendChild(subContnet);
				} else if (Array.isArray(content[key])) {
					let list: string[] = content[key];

					const subKey = document.createElement("p");
					subKey.textContent = this.snakeCaseToNormal(key);
					subKey.classList.add("title");
					fieldDiv.appendChild(subKey);

					const listDiv = document.createElement("div");
					listDiv.classList.add("listdiv");
					fieldDiv.appendChild(listDiv);

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
						fieldDiv.appendChild(subKey);

						const subContnet = this.generateAElementFromUrl(
							content[key].content,
							ctx,
						);
						fieldDiv.appendChild(subContnet);
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
			sourcePath,
		);

		let parsedurl: parsedUrl = { type: "internal", url: file!.path };
		return parsedurl;
	}

	generateAElementFromUrl(
		url: string,
		ctx: MarkdownPostProcessorContext,
	): HTMLAnchorElement {
		const element = document.createElement("a");

		const linkPattern = /\[\[(.*?)(?:\|(.*?))?\]\]/;
		const match = url.match(linkPattern);

		if (match) {
			const link = match[1]; // The actual link
			const name = match[2] || link; // The name or the link if name is not provided

			element.textContent = name;

			let parsedUrl = this.parseUrl(link, ctx.sourcePath);
			element.href = parsedUrl.url;
			if (parsedUrl.type === "internal") {
				element.classList.add("internal-link");
			}
		} else {
			// Fallback in case the regex does not match
			element.textContent = url.replace(/\[|\]/g, "");
			element.href = this.parseUrl(url, ctx.sourcePath).url;
		}

		return element;
	}
}
