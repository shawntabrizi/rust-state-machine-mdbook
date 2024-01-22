const simpleGit = require("simple-git");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoUrl = process.argv[2];

if (!repoUrl) {
	console.error(
		"Please provide a GitHub repository URL as a command-line argument."
	);
	process.exit(1);
}

const repoName = repoUrl
	.split("/")
	.pop()
	.replace(/\.git$/, "");
const repoPath = path.join(__dirname, repoName);
const sourcePath = path.join(repoPath, "source");

// Clone the repository
console.log(`Cloning repository: ${repoUrl}`);
simpleGit().clone(repoUrl, sourcePath, (err, _) => {
	if (err) {
		console.error(`Error cloning repository: ${err}`);
		process.exit();
	}

	// Get the list of commits
	console.log("Fetching commits...");
	const commitHashes = execSync(`git -C ${sourcePath} log --format=%H::%s`, {
		encoding: "utf-8",
	})
		.trim()
		.split("\n");

	let stepCounter = 0;
	let templateFound = false;
	let solutionFound = false;
	let templateFiles = [];
	let solutionFiles = [];
	let sourceFiles = [];
	let stepNames = [];

	// Create a folder for each commit
	// Reverse to make the oldest commit first
	commitHashes.reverse().forEach((commitInfo, index) => {
		const [commitHash, commitMessage] = commitInfo.split("::");
		const isReadme = commitMessage.toLowerCase().startsWith("readme: ");
		const isTemplate = commitMessage.toLowerCase().startsWith("template: ");
		const isSolution = commitMessage.toLowerCase().startsWith("solution: ");
		const isSection = commitMessage.toLowerCase().startsWith("section: ");
		const isAction = commitMessage.toLowerCase().startsWith("action: ");

		let stepFolder = path.join(repoPath, stepCounter.toString());
		if (!fs.existsSync(stepFolder)) {
			fs.mkdirSync(stepFolder);
		}

		let sourceFolder = path.join(stepFolder, "source");
		let templateFolder = path.join(stepFolder, "template");
		let solutionFolder = path.join(stepFolder, "solution");

		// Default assumption is output is not a template or solution
		let outputFolder = sourceFolder;

		if (isTemplate) {
			// Check there isn't a template already in queue
			if (templateFound) {
				console.error("A second template was found before a solution.");
				process.exit(1);
			}

			templateFound = true;

			// make step folder
			outputFolder = templateFolder;
		}

		if (isSolution) {
			// Check that there is a template in queue
			if (!templateFound) {
				console.error("No template was found for this solution.");
				process.exit(1);
			}

			// Check that a solution is not already found.
			if (solutionFound) {
				console.error("A second solution was found before a template.");
				process.exit(1);
			}

			solutionFound = true;
			outputFolder = solutionFolder;
		}

		fs.mkdirSync(outputFolder);

		// Checkout the commit
		console.log(`Checking out commit: ${commitHash}`);
		execSync(`git -C ${sourcePath} checkout ${commitHash}`);

		// Copy the contents to the commit folder
		execSync(`cp -r ${sourcePath}/* ${outputFolder}`);
		console.log(`Contents of commit ${index} copied to ${outputFolder}`);

		let diffOutput = "";
		let diffRaw = "";

		let previousCommit = "HEAD~1";
		// This is the commit hash for an empty git project.
		let emptyTree = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

		if (index == 0) {
			previousCommit = emptyTree;
		}

		// Get the list of modified or created files in the commit
		diffOutput = execSync(
			`git -C ${sourcePath} diff --name-status ${previousCommit} HEAD`,
			{ encoding: "utf-8" }
		)
			.trim()
			.split("\n");
		diffRaw = execSync(
			`git -C ${sourcePath} diff ${previousCommit} HEAD ':(exclude)README.md'`,
			{ encoding: "utf-8" }
		);

		// Create a raw output
		let diff_name = "changes.diff";
		if (isSolution) {
			diff_name = "solution.diff";
		} else if (isTemplate) {
			diff_name = "template.diff";
		}
		const diffFilePath = path.join(outputFolder, diff_name);
		fs.writeFileSync(diffFilePath, diffRaw);

		// Create a JSON file in the commit folder
		const jsonFilePath = path.join(outputFolder, "commit_info.json");
		const commitInfoObject = {
			commitHash,
			commitMessage,
			files: diffOutput.map((line) => {
				const [status, file] = line.split("\t");
				return { status, file };
			}),
		};

		if (isTemplate) {
			templateFiles = commitInfoObject.files;
		} else if (isSolution) {
			solutionFiles = commitInfoObject.files;
		} else {
			sourceFiles = commitInfoObject.files;
		}

		fs.writeFileSync(jsonFilePath, JSON.stringify(commitInfoObject, null, 2));

		// Reset sanity check and increment step
		// Handle when both template and solution is found,
		// or when there is a step that is neither a template or solution
		if (
			(templateFound && solutionFound) ||
			(!templateFound && !solutionFound)
		) {
			if (isReadme) {
				markdownContent = sectionMarkdown;
			} else if (isSection) {
				markdownContent = sectionMarkdown;
				stepNames.push({
					name: getStepName(sourceFolder),
					is_section: true,
				});
			} else if (templateFound) {
				markdownContent = templateMarkdown;
				let templateFileText = generateFileMarkdown("template", templateFiles);
				let solutionFileText = generateFileMarkdown("solution", solutionFiles);
				markdownContent = markdownContent.replace(
					"<!-- insert_template_files -->",
					templateFileText
				);
				markdownContent = markdownContent.replace(
					"<!-- insert_solution_files -->",
					solutionFileText
				);

				let diffText = generateDiffMarkdown("template");
				markdownContent = markdownContent.replace(
					"<!-- insert_diff_files -->",
					diffText
				);

				stepNames.push({
					name: getStepName(templateFolder),
					is_section: false,
				});
			} else {
				markdownContent = sourceMarkdown;
				let sourceFileText = generateFileMarkdown("source", sourceFiles);
				markdownContent = markdownContent.replace(
					"<!-- insert_source_files -->",
					sourceFileText
				);

				let diffText = generateDiffMarkdown("source");
				markdownContent = markdownContent.replace(
					"<!-- insert_diff_files -->",
					diffText
				);

				stepNames.push({
					name: getStepName(sourceFolder),
					is_section: false,
				});
			}
			// Create a Markdown file in the commit folder
			const markdownFilePath = path.join(stepFolder, "README.md");
			fs.writeFileSync(markdownFilePath, markdownContent);
			stepCounter += 1;
			templateFound = false;
			solutionFound = false;
		}
	});

	generateSidebar(stepNames);

	// Clean up source folder
	fs.rmSync(sourcePath, { recursive: true, force: true });

	console.log("Process completed.");
});

// Generate the markdown text for files.
function generateFileMarkdown(type, files) {
	// type is expected to be one of "source", "solution", or "template"
	if (type != "solution" && type != "source" && type != "template") {
		process.exit(1);
	}

	let output = "";

	let parsedFiles = [];
	for (file of files) {
		if (!file.file) {
			continue;
		}

		let filepath = `./${type}/${file.file}`;
		let filename = path.parse(filepath).base;

		// Skip README
		if (filename == "README.md") {
			continue;
		}
		// Skip hidden files
		if (filename.startsWith(".")) {
			continue;
		}
		// Skip Cargo.lock
		if (filename == "Cargo.lock") {
			continue;
		}

		let classStyle = `file-${type}`;
		if (file.status == "M") {
			classStyle += " file-modified";
		} else if (file.status == "A") {
			classStyle += " file-added";
		} else if (file.status == "D") {
			classStyle += " file-deleted";
		}

		let codeStyle = "text";
		let extname = path.extname(filepath);
		if (extname == ".rs") {
			codeStyle = "rust";
		} else if (extname == ".toml") {
			codeStyle = "toml";
		}

		parsedFiles.push({ filename: file.file, classStyle, codeStyle, filepath})
	}

	if (parsedFiles.length > 0) {
		output += `<div class="tab">\n`;

		for ([i, file] of parsedFiles.entries()) {
			output += `<button class="subtab tablinks ${file.classStyle}${i == 0 ? " active" : ""}" onclick="switchSubTab(event, '${file.filename}')" data-id="${file.filename}">${file.filename}</button>\n`;
		}

		output += `</div>\n`

		for ([i, file] of parsedFiles.entries()) {
			output += `<div id="${type}/${file.filename}" class="subtab tabcontent${i == 0 ? " active" : ""}" data-id="${file.filename}">\n\n`;
			output += `\`\`\`${file.codeStyle}\n{{#include ${file.filepath}}}\n\`\`\`\n\n`;
			output += `</div>\n\n`;
		}
	} else {
		output = "No files edited in this step.";
	}

	return output;
}

function generateDiffMarkdown(type) {
	let output = "";

	if (type == "template" || type == "solution") {
		output += solutionDiffMarkdown;
	} else {
		output += changesDiffMarkdown;
	}

	return output;
}

let solutionDiffMarkdown = `
<div class="tab">
	<button class="difftab tablinks active" onclick="switchDiff(event, 'template.diff')">template.diff</button>
	<button class="difftab tablinks" onclick="switchDiff(event, 'solution.diff')">solution.diff</button>
</div>
<div id="template.diff" class="subtab tabcontent active" data-id="template.diff">

\`\`\`diff\n{{#include ./template/template.diff}}\n\`\`\`

</div>
<div id="solution.diff" class="subtab tabcontent" data-id="solution.diff">

\`\`\`diff\n{{#include ./solution/solution.diff}}\n\`\`\`

</div>`;

let changesDiffMarkdown = `
<div class="tab">
	<button class="difftab tablinks active" onclick="switchDiff(event, 'changes.diff')">changes.diff</button>
</div>
<div id="changes.diff" class="subtab tabcontent active" data-id="changes.diff">

\`\`\`diff\n{{#include ./source/changes.diff}}\n\`\`\`

</div>`;

let templateMarkdown = `
<div class="content-row">
<div class="content-col">

{{#include ./template/README.md}}

</div>

<div class="content-col">

<div class="tab">
  <button class="maintab tablinks active" onclick="switchMainTab(event, 'Template')">Template</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Solution')">Solution</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Diff')">Diff</button>
</div>

<div id="Template" class="maintab tabcontent active">

<!-- insert_template_files -->

</div>

<div id="Solution" class="maintab tabcontent">

<!-- insert_solution_files -->

</div>

<div id="Diff" class="maintab tabcontent">

<!-- insert_diff_files -->

</div>

</div>
</div>
`;

let sourceMarkdown = `
<div class="content-row">
<div class="content-col">

{{#include ./source/README.md}}

</div>
<div class="content-col">

<div class="tab">
  <button class="maintab tablinks active" onclick="switchMainTab(event, 'Source')">Source</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Diff')">Diff</button>
</div>

<div id="Source" class="maintab tabcontent active">

<!-- insert_source_files -->

</div>

<div id="Diff" class="maintab tabcontent">

<!-- insert_diff_files -->

</div>

</div>
</div>
`;

let sectionMarkdown = `
<div class="content-section">

{{#include ./source/README.md}}

</div>
`;

function getStepName(folder) {
	const filePath = path.join(folder, "README.md");
	const markdownContent = fs.readFileSync(filePath, "utf8");
	const titleMatch = markdownContent.match(/^#\s+(.*)/m);
	if (titleMatch) {
		return titleMatch[1];
	} else {
		console.error(`Error getting markdown title.`);
		process.exit(1);
	}
}

function generateSidebar(steps) {
	const sidebarFilePath = path.join(repoPath, "SUMMARY.md");
	let output = "";
	steps.forEach(({ name, is_section }, index) => {
		if (!is_section) {
			output += `    `;
		}
		output += `- [${index}. ${name}](${index}/README.md)\n`;
	});
	fs.writeFileSync(sidebarFilePath, output);
}
