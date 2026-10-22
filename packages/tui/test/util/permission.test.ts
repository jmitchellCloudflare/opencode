import { expect, test } from "bun:test"
import type { PermissionResourceResult } from "@opencode/client"
import { permissionPresentation } from "../../src/util/permission"

function result(resource: string, effect: PermissionResourceResult["effect"]): PermissionResourceResult {
  return { resource, effect, rule: { action: "shell", resource: "*", effect: "ask", origin: "default" } }
}

test("preserves permission roots and self-contained metadata", () => {
  expect(permissionPresentation({ action: "external_directory", resources: ["/*"] }).title).toBe(
    "Access external directory /",
  )
  expect(permissionPresentation({ action: "external_directory", resources: ["C:/*"] }).title).toBe(
    "Access external directory C:/",
  )
  expect(
    permissionPresentation({ action: "webfetch", resources: [], metadata: { url: "https://example.com" } }),
  ).toMatchObject({
    title: "WebFetch https://example.com",
    lines: ["URL: https://example.com"],
  })
  expect(permissionPresentation({ action: "websearch", resources: [], metadata: { query: "releases" } })).toMatchObject(
    {
      title: 'Web Search "releases"',
      lines: ["Query: releases"],
    },
  )
})

test("lists shell resources with their effects when results are present", () => {
  expect(
    permissionPresentation({
      action: "shell",
      resources: ["git status", "pwd", "rm build"],
      resourceResults: [result("git status", "allow"), result("pwd", "saved"), result("rm build", "ask")],
      input: { command: "git status && pwd && rm build" },
    }),
  ).toMatchObject({
    title: "Shell command",
    lines: ["$ git status && pwd && rm build", "- git status", "- pwd", "⚠ rm build"],
    lineEffects: [undefined, "allow", "saved", "ask"],
  })
})

test("takes each line's resource text from resourceResults, independent of the resources list", () => {
  // resourceResults is self-describing (each entry carries its own resource text), so it drives the
  // display even if it covers fewer or different commands than the plain resources list.
  expect(
    permissionPresentation({
      action: "shell",
      resources: ["git status", "pwd", "rm build"],
      resourceResults: [result("git status", "allow")],
    }),
  ).toMatchObject({
    lines: ["- git status"],
    lineEffects: ["allow"],
  })
})

test("keeps the full shell command when no results are present", () => {
  const input = { command: "git status && rm build" }
  for (const resourceResults of [undefined, []]) {
    const presentation = permissionPresentation({
      action: "shell",
      resources: ["git status", "rm build"],
      resourceResults,
      input,
    })
    expect(presentation.lines).toEqual(["$ git status && rm build"])
    expect(presentation.lineEffects).toBeUndefined()
  }
})
