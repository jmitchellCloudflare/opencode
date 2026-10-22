import { For, Show } from "solid-js"
import type { PermissionRequest, PermissionResourceEffect, PermissionResourceRule } from "@opencode/client/promise"
import { Button } from "@opencode/ui/button"
import { DockPrompt } from "@opencode/session-ui/dock-prompt"
import { Icon } from "@opencode/ui/icon"
import { Tooltip } from "@opencode/ui/tooltip"
import { useLanguage } from "@/runtime/i18n/language"

type PermissionLine = { resource: string; effect?: PermissionResourceEffect; rule?: PermissionResourceRule }

function effectClass(effect: PermissionResourceEffect | undefined) {
  if (effect === "allow") return "text-v2-state-fg-success"

  if (effect === "ask") return "text-v2-state-fg-warning"

  if (effect === "saved") return "text-v2-state-fg-info"

  return "text-text-base"
}

export function SessionPermissionDock(props: {
  request: PermissionRequest
  responding: boolean
  onDecide: (response: "once" | "always" | "reject") => void
}) {
  const language = useLanguage()

  const toolDescription = () => {
    const key = `settings.permissions.tool.${props.request.action}.description`
    const value = language.t(key as Parameters<typeof language.t>[0])

    if (value === key) return ""

    return value
  }

  // Pairs each resource with its evaluated effect/rule by iterating one source list, so a request
  // whose resourceResults length ever drifted from resources could never misattribute a result.
  const lines = (): PermissionLine[] =>
    props.request.resourceResults ?? props.request.resources.map((resource) => ({ resource }))

  const ruleLabel = (rule: PermissionResourceRule) => {
    if (rule.origin === "default") return language.t("notification.permission.rule.default")

    if (rule.origin === "saved")
      return language.t("notification.permission.rule.saved", { action: rule.action, resource: rule.resource })

    return language.t("notification.permission.rule.config", {
      action: rule.action,
      resource: rule.resource,
      effect: rule.effect,
    })
  }

  return (
    <DockPrompt
      kind="permission"
      header={
        <div data-slot="permission-row" data-variant="header">
          <span data-slot="permission-icon">
            <Icon name="warning" size="normal" />
          </span>
          <div data-slot="permission-header-title">{language.t("notification.permission.title")}</div>
        </div>
      }
      footer={
        <>
          <div />
          <div data-slot="permission-footer-actions">
            <Button variant="ghost" size="normal" onClick={() => props.onDecide("reject")} disabled={props.responding}>
              {language.t("ui.permission.deny")}
            </Button>
            <Button
              variant="neutral"
              size="normal"
              onClick={() => props.onDecide("always")}
              disabled={props.responding}
            >
              {language.t("ui.permission.allowAlways")}
            </Button>
            <Button variant="submit" size="normal" onClick={() => props.onDecide("once")} disabled={props.responding}>
              {language.t("ui.permission.allowOnce")}
            </Button>
          </div>
        </>
      }
    >
      <Show when={toolDescription()}>
        <div data-slot="permission-row">
          <span data-slot="permission-spacer" aria-hidden="true" />
          <div data-slot="permission-hint">{toolDescription()}</div>
        </div>
      </Show>

      <Show when={lines().length > 0}>
        <div data-slot="permission-row">
          <span data-slot="permission-spacer" aria-hidden="true" />
          <div data-slot="permission-patterns">
            <For each={lines()}>
              {(line) => {
                const needsApproval = () => line.effect === "ask"

                return (
                  <div class="flex items-start gap-2">
                    <Show when={needsApproval()}>
                      <span class="sr-only">{language.t("notification.permission.ask.label")}</span>
                    </Show>
                    <code
                      class={`text-12-regular break-all flex-1 min-w-0 ${effectClass(line.effect)}`}
                      data-effect={line.effect}
                    >
                      {line.resource}
                    </code>
                    <Show when={line.rule}>
                      {(rule) => (
                        <Tooltip placement="top" triggerTabIndex={0} value={ruleLabel(rule())}>
                          <span
                            class={`shrink-0 ${needsApproval() ? "text-v2-state-fg-warning" : "text-v2-text-text-muted"}`}
                            data-slot="permission-rule"
                          >
                            <Icon name={needsApproval() ? "warning" : "info"} size="small" />
                          </span>
                        </Tooltip>
                      )}
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </Show>
    </DockPrompt>
  )
}
