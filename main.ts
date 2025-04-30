import { Plugin, MarkdownPostProcessorContext, TFile } from "obsidian";
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

	createInfoboxElement(content: JsonMap, ctx: MarkdownPostProcessorContext) {
		const div = document.createElement("div");
		div.classList.add("infobox");

		const keys = Object.keys(content);
		const imageKey = keys.find((key) => key.toLowerCase() === "image");
		const titleKey = keys.find((key) => key.toLowerCase() === "title");

		if (imageKey && typeof content[imageKey] === "string") {
			const img = document.createElement("img");
			img.src = content[imageKey] as string;
			div.appendChild(img);
		}

		if (titleKey && typeof content[titleKey] === "string") {
			const title = document.createElement("h1");
			title.textContent = content[titleKey] as string;
			div.appendChild(title);
		} else if (!content.title && Object.keys(content).length > 0) {
			const filePath = ctx.sourcePath;
			const noteName = filePath.substring(
				filePath.lastIndexOf("/") + 1,
				filePath.lastIndexOf(".")
			);

			const title = document.createElement("h1");
			title.textContent = noteName;
			div.appendChild(title);
		}

		const remainingKeys = keys.filter(
			(key) => key !== "image" && key !== "title"
		);

		if (remainingKeys.length === 0) return div;

		const infoboxContent = document.createElement("div");
		infoboxContent.classList.add("infobox-content");
		div.appendChild(infoboxContent);
		for (const key in content) {
			// Skip if the property is 'img' or 'title'
			if (key === imageKey || key === titleKey) continue;

			// Make sure this is a property of the object, not something from the prototype chain
			if (content.hasOwnProperty(key)) {
				const value = content[key];

				const fieldDiv = document.createElement("div");
				fieldDiv.classList.add("field-div");
				infoboxContent.appendChild(fieldDiv);

				const subKey = document.createElement("p");
				subKey.textContent = this.snakeCaseToNormal(key);
				subKey.classList.add("title");
				fieldDiv.appendChild(subKey);

				if (typeof value === "string") {
					const subContnet = document.createElement("p");
					const contentString = value;

					const interalLinkRegex = /\[\[.*?\]\]/;

					const parts = contentString
						.split(/(\[\[.*?\]\])| /)
						.filter(Boolean);
					let textBuffer = "";

					parts.forEach((part: string, index: number) => {
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

					subContnet.classList.add("field-content");
					fieldDiv.appendChild(subContnet);
				} else if (Array.isArray(value)) {
					const list: unknown[] = value;

					const subKey = document.createElement("p");
					subKey.textContent = this.snakeCaseToNormal(key);
					subKey.classList.add("title");
					fieldDiv.appendChild(subKey);

					const listDiv = document.createElement("div");
					listDiv.classList.add("listdiv");
					fieldDiv.appendChild(listDiv);

					list.forEach((element) => {
						if (typeof element !== "string") return;
						const subContnet = document.createElement("p");
						subContnet.textContent = element;
						listDiv.appendChild(subContnet);
					});
				} else if (
					typeof value === "object" &&
					value !== null &&
					"link" in value &&
					"content" in value
				) {
					const linkData = value as {
						link: unknown;
						content: unknown;
					};
					if (
						typeof linkData.content === "string" &&
						typeof linkData.link === "string"
					) {
						const subContent = this.generateAElementFromUrl(
							linkData.link,
							ctx
						);
						subContent.textContent = linkData.content;
						fieldDiv.appendChild(subContent);
					}
				}
			}
		}

		return div;
	}

	parseUrl(url: string, sourcePath: string): parsedUrl {
		const internalLinkRegex = /\[\[(.*?)(?:#(.*?))?(?:\|(.*?))?\]\]/;
		const match = url.match(internalLinkRegex);

		if (!match) {
			const parsedurl: parsedUrl = { type: "external", url: url };
			return parsedurl;
		}

		const noteName = match[1];
		const noteHeader = match[2];

		const file = this.app.metadataCache.getFirstLinkpathDest(
			noteName,
			sourcePath
		);

		if (!file) {
			const parsedurl: parsedUrl = { type: "external", url: url };
			return parsedurl;
		}

		const newUrl = `${file.path}${noteHeader ? `#${noteHeader}` : ""}`;
		const parsedurl: parsedUrl = {
			type: "internal",
			url: newUrl,
		};
		return parsedurl;
	}

	generateAElementFromUrl(
		url: string,
		ctx: MarkdownPostProcessorContext
	): HTMLAnchorElement {
		const element = document.createElement("a");

		const linkPattern = /\[\[(.*?)(?:#(.*?))?(?:\|(.*?))?\]\]/;
		const match = url.match(linkPattern);

		if (match) {
			const link = match[1]; // The actual link
			const header = match[2];
			const name = match[3] || `${link}${header ? `#${header}` : ""}`;

			const reconstructedUrl = `[[${link}${
				header ? `#${header}]]` : "]]"
			}`;

			element.textContent = name;

			const parsedUrl = this.parseUrl(reconstructedUrl, ctx.sourcePath);
			element.href = parsedUrl.url;
			if (parsedUrl.type === "internal")
				element.classList.add("internal-link");
		} else {
			// Fallback in case the regex does not match
			element.textContent = url.replace(/\[|\]/g, "");
			element.href = this.parseUrl(url, ctx.sourcePath).url;
		}

		return element;
	}

	getFileFromContext(ctx: MarkdownPostProcessorContext): TFile | null {
		const filePath = ctx.sourcePath;
		return this.app.metadataCache.getFirstLinkpathDest(filePath, "");
	}
}
