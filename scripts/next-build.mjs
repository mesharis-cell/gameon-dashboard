import fs from "node:fs";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";

const originalRename = fs.promises.rename.bind(fs.promises);

fs.promises.rename = async (source, target) => {
  try {
    return await originalRename(source, target);
  } catch (error) {
    if (error?.code !== "EXDEV") {
      throw error;
    }

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    await unlink(source);
  }
};

process.argv = [process.argv[0], process.argv[1], "build", ...process.argv.slice(2)];

await import("next/dist/bin/next");
