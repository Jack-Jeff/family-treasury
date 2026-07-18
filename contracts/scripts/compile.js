// Compiles src/*.sol using the locally npm-installed `solc` package (no network calls),
// then writes artifact JSON files in the same shape Hardhat/ethers expect, so
// `hardhat test` / `hardhat run` keep working normally against a real Monad/Ethereum node.
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const SRC_DIR = path.join(__dirname, "..", "src");
const NODE_MODULES = path.join(__dirname, "..", "node_modules");
const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts");

function findImport(importPath) {
  try {
    const resolved = importPath.startsWith(".")
      ? importPath
      : path.join(NODE_MODULES, importPath);
    return { contents: fs.readFileSync(resolved, "utf8") };
  } catch (e) {
    return { error: "File not found: " + importPath };
  }
}

function collectSources(dir) {
  const sources = {};
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".sol")) {
      sources[file] = { content: fs.readFileSync(path.join(dir, file), "utf8") };
    }
  }
  return sources;
}

function main() {
  const sources = collectSources(SRC_DIR);
  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "metadata"] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

  let hasError = false;
  if (output.errors) {
    for (const err of output.errors) {
      console.log(err.formattedMessage);
      if (err.severity === "error") hasError = true;
    }
  }
  if (hasError) process.exit(1);

  for (const fileName of Object.keys(output.contracts)) {
    for (const contractName of Object.keys(output.contracts[fileName])) {
      const c = output.contracts[fileName][contractName];
      const outDir = path.join(ARTIFACTS_DIR, "src", fileName);
      fs.mkdirSync(outDir, { recursive: true });
      const artifact = {
        _format: "hh-sol-artifact-1",
        contractName,
        sourceName: "src/" + fileName,
        abi: c.abi,
        bytecode: "0x" + c.evm.bytecode.object,
        deployedBytecode: "0x" + c.evm.deployedBytecode.object,
        linkReferences: {},
        deployedLinkReferences: {},
      };
      fs.writeFileSync(path.join(outDir, contractName + ".json"), JSON.stringify(artifact, null, 2));
      console.log("Compiled", fileName, "->", contractName);
    }
  }
}

main();
