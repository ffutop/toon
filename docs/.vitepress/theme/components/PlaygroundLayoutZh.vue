<script setup lang="ts">
import type { Delimiter, EncodeOptions } from '../../../../packages/toon/src'
import { useClipboard, useDebounceFn } from '@vueuse/core'
import { unzlibSync, zlibSync } from 'fflate'
import { base64ToUint8Array, stringToUint8Array, uint8ArrayToBase64, uint8ArrayToString } from 'uint8array-extras'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { DEFAULT_DELIMITER, encode } from '../../../../packages/toon/src'
import VPInput from './VPInput.vue'

// Chinese localized fork of PlaygroundLayout.vue.
// Keep behavior in sync with upstream; only UI copy and example data should differ.

type InputFormat = 'json' | 'yaml'
type JsonFormat = 'pretty-2' | 'pretty-4' | 'pretty-tab' | 'compact'

interface PlaygroundState extends Required<Pick<EncodeOptions, 'delimiter' | 'indent' | 'keyFolding' | 'flattenDepth'>> {
  input: string
  inputFormat: InputFormat
  jsonFormat: JsonFormat
  /** Pre-YAML share URLs stored input under `json`. Read-only fallback. */
  json?: string
}

function parseInput(text: string, format: InputFormat): unknown {
  return format === 'yaml' ? parseYaml(text) : JSON.parse(text)
}

function stringifyInputYaml(value: unknown): string {
  return stringifyYaml(value, { lineWidth: 0 })
}

const PRESETS = {
  hikesZh: {
    背景: {
      任务: '整理好友春季徒步记录',
      地点: '杭州',
      季节: '2025_春季',
    },
    好友: ['安娜', '小林', '阿明'],
    徒步: [
      { id: 1, 路线: '九溪烟树', 距离公里: 7.5, 爬升高度: 320, 同行人: '安娜', 天气晴朗: true },
      { id: 2, 路线: '北高峰环线', 距离公里: 9.2, 爬升高度: 540, 同行人: '小林', 天气晴朗: false },
      { id: 3, 路线: '云栖竹径', 距离公里: 5.1, 爬升高度: 180, 同行人: '阿明', 天气晴朗: true },
    ],
  },
  ordersZh: {
    订单: [
      {
        订单号: 'ORD-001',
        客户: { 姓名: '陈安', 邮箱: 'alice@example.com' },
        商品: [
          { sku: 'WIDGET-A', 数量: 2, 单价: 29.99 },
          { sku: 'GADGET-B', 数量: 1, 单价: 49.99 },
        ],
        总额: 109.97,
        状态: '已发货',
      },
      {
        订单号: 'ORD-002',
        客户: { 姓名: '李博', 邮箱: 'bob@example.com' },
        商品: [
          { sku: 'THING-C', 数量: 3, 单价: 15.00 },
        ],
        总额: 45.00,
        状态: '已送达',
      },
    ],
  },
  metricsZh: {
    指标: [
      { 日期: '2025-01-01', 浏览量: 5200, 点击: 180, 转化: 24, 收入: 2890.50 },
      { 日期: '2025-01-02', 浏览量: 6100, 点击: 220, 转化: 31, 收入: 3450.00 },
      { 日期: '2025-01-03', 浏览量: 4800, 点击: 165, 转化: 19, 收入: 2100.25 },
      { 日期: '2025-01-04', 浏览量: 5900, 点击: 205, 转化: 28, 收入: 3200.00 },
    ],
  },
  eventsZh: {
    日志: [
      { 时间: '2025-01-15T10:23:45Z', 级别: 'info', 接口: '/api/users', 状态码: 200, 响应毫秒: 45 },
      { 时间: '2025-01-15T10:24:12Z', 级别: 'error', 接口: '/api/orders', 状态码: 500, 响应毫秒: 120, 错误: { 消息: '数据库超时', 可重试: true } },
      { 时间: '2025-01-15T10:25:03Z', 级别: 'info', 接口: '/api/products', 状态码: 200, 响应毫秒: 32 },
      { 时间: '2025-01-15T10:26:47Z', 级别: 'warn', 接口: '/api/payment', 状态码: 429, 响应毫秒: 5, 错误: { 消息: '请求过于频繁', 可重试: true } },
    ],
  },
  hikes: {
    context: {
      task: 'Our favorite hikes together',
      location: 'Boulder',
      season: 'spring_2025',
    },
    friends: ['ana', 'luis', 'sam'],
    hikes: [
      { id: 1, name: 'Blue Lake Trail', distanceKm: 7.5, elevationGain: 320, companion: 'ana', wasSunny: true },
      { id: 2, name: 'Ridge Overlook', distanceKm: 9.2, elevationGain: 540, companion: 'luis', wasSunny: false },
      { id: 3, name: 'Wildflower Loop', distanceKm: 5.1, elevationGain: 180, companion: 'sam', wasSunny: true },
    ],
  },
  orders: {
    orders: [
      {
        orderId: 'ORD-001',
        customer: { name: 'Alice Chen', email: 'alice@example.com' },
        items: [
          { sku: 'WIDGET-A', quantity: 2, price: 29.99 },
          { sku: 'GADGET-B', quantity: 1, price: 49.99 },
        ],
        total: 109.97,
        status: 'shipped',
      },
      {
        orderId: 'ORD-002',
        customer: { name: 'Bob Smith', email: 'bob@example.com' },
        items: [
          { sku: 'THING-C', quantity: 3, price: 15.00 },
        ],
        total: 45.00,
        status: 'delivered',
      },
    ],
  },
  metrics: {
    metrics: [
      { date: '2025-01-01', views: 5200, clicks: 180, conversions: 24, revenue: 2890.50 },
      { date: '2025-01-02', views: 6100, clicks: 220, conversions: 31, revenue: 3450.00 },
      { date: '2025-01-03', views: 4800, clicks: 165, conversions: 19, revenue: 2100.25 },
      { date: '2025-01-04', views: 5900, clicks: 205, conversions: 28, revenue: 3200.00 },
    ],
  },
  events: {
    logs: [
      { timestamp: '2025-01-15T10:23:45Z', level: 'info', endpoint: '/api/users', statusCode: 200, responseTime: 45 },
      { timestamp: '2025-01-15T10:24:12Z', level: 'error', endpoint: '/api/orders', statusCode: 500, responseTime: 120, error: { message: 'Database timeout', retryable: true } },
      { timestamp: '2025-01-15T10:25:03Z', level: 'info', endpoint: '/api/products', statusCode: 200, responseTime: 32 },
      { timestamp: '2025-01-15T10:26:47Z', level: 'warn', endpoint: '/api/payment', statusCode: 429, responseTime: 5, error: { message: 'Rate limit exceeded', retryable: true } },
    ],
  },
} as const
const DELIMITER_OPTIONS: { value: Delimiter, label: string }[] = [
  { value: ',', label: '逗号 (,)' },
  { value: '\t', label: '制表符 (\\t)' },
  { value: '|', label: '竖线 (|)' },
]
const JSON_FORMAT_OPTIONS: { value: JsonFormat, label: string, indent: string | number | undefined }[] = [
  { value: 'pretty-2', label: '美化 (2 个空格)', indent: 2 },
  { value: 'pretty-4', label: '美化 (4 个空格)', indent: 4 },
  { value: 'pretty-tab', label: '美化 (制表符)', indent: '\t' },
  { value: 'compact', label: '紧凑', indent: undefined },
]
const DEFAULT_JSON = JSON.stringify(PRESETS.hikesZh, undefined, 2)
const SHARE_URL_LIMIT = 8 * 1024

// Input state
const inputText = ref(DEFAULT_JSON)
const inputFormat = ref<InputFormat>('json')
const jsonFormat = ref<JsonFormat>('pretty-2')
const currentFormatIndent = computed(() =>
  JSON_FORMAT_OPTIONS.find(opt => opt.value === jsonFormat.value)?.indent,
)
const formattedInput = computed(() => {
  try {
    const data = parseInput(inputText.value, inputFormat.value)
    return inputFormat.value === 'yaml' ? stringifyInputYaml(data) : formatJson(data)
  }
  catch {
    return inputText.value
  }
})

// Encoder options
const delimiter = ref<Delimiter>(DEFAULT_DELIMITER)
const indent = ref(2)
const keyFolding = ref<'off' | 'safe'>('safe')
const flattenDepth = ref(2)

// Encoding output
const encodingResult = computed(() => {
  try {
    const parsedInput = parseInput(inputText.value, inputFormat.value)
    return {
      output: encode(parsedInput, {
        indent: indent.value,
        delimiter: delimiter.value,
        keyFolding: keyFolding.value,
        flattenDepth: flattenDepth.value,
      }),
      error: undefined,
    }
  }
  catch (error) {
    const fallback = inputFormat.value === 'yaml' ? 'YAML 无效' : 'JSON 无效'
    return {
      output: '',
      error: error instanceof Error ? error.message : fallback,
    }
  }
})
const toonOutput = computed(() => encodingResult.value.output)
const error = computed(() => encodingResult.value.error)

// Token analysis
const tokenizer = shallowRef<typeof import('gpt-tokenizer') | undefined>()
const inputTokens = computed(() =>
  tokenizer.value?.encode(formattedInput.value).length,
)
const toonTokens = computed(() =>
  tokenizer.value && toonOutput.value ? tokenizer.value.encode(toonOutput.value).length : undefined,
)
const tokenSavings = computed(() => {
  if (!inputTokens.value || !toonTokens.value)
    return

  const diff = inputTokens.value - toonTokens.value
  const percent = Math.abs((diff / inputTokens.value) * 100).toFixed(1)
  const sign = diff > 0 ? '−' : '+'

  return { diff, percent, sign, isSavings: diff > 0 }
})

// UI state
const canShareState = ref(true)
const hasCopiedUrl = ref(false)

const { copy, copied } = useClipboard({ source: toonOutput })
const updateUrl = useDebounceFn(() => {
  const hash = encodeState()
  const baseUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
  const targetUrl = `${baseUrl}#${hash}`

  if (targetUrl.length > SHARE_URL_LIMIT) {
    canShareState.value = false
    return
  }

  canShareState.value = true
  window.history.replaceState(null, '', `#${hash}`)
}, 300)

watch([inputText, delimiter, indent, keyFolding, flattenDepth, jsonFormat, inputFormat], () => {
  updateUrl()
})

watch(jsonFormat, () => {
  if (inputFormat.value !== 'json')
    return
  try {
    inputText.value = formatJson(JSON.parse(inputText.value))
  }
  catch {}
})

watch(inputFormat, (next, prev) => {
  if (prev === next)
    return
  try {
    const data = parseInput(inputText.value, prev)
    inputText.value = next === 'yaml' ? stringifyInputYaml(data) : formatJson(data)
  }
  catch {}
})

onMounted(() => {
  loadTokenizer()

  const hash = window.location.hash.slice(1)
  if (!hash)
    return

  const state = decodeState(hash)
  if (state) {
    inputText.value = state.input ?? state.json
    delimiter.value = state.delimiter
    indent.value = state.indent
    keyFolding.value = state.keyFolding ?? 'safe'
    flattenDepth.value = state.flattenDepth ?? 2
    jsonFormat.value = state.jsonFormat ?? 'pretty-2'
    inputFormat.value = state.inputFormat ?? 'json'
  }
})

function formatJson(value: unknown) {
  return JSON.stringify(value, undefined, currentFormatIndent.value)
}

function encodeState() {
  const state: PlaygroundState = {
    input: inputText.value,
    inputFormat: inputFormat.value,
    delimiter: delimiter.value,
    indent: indent.value,
    keyFolding: keyFolding.value,
    flattenDepth: flattenDepth.value,
    jsonFormat: jsonFormat.value,
  }

  const compressedData = zlibSync(stringToUint8Array(JSON.stringify(state)))
  return uint8ArrayToBase64(compressedData, { urlSafe: true })
}

function decodeState(hash: string) {
  try {
    const bytes = base64ToUint8Array(hash)
    const decompressedData = unzlibSync(bytes)
    const decodedData = uint8ArrayToString(decompressedData)
    if (decodedData)
      return JSON.parse(decodedData) as PlaygroundState
  }
  catch {}
}

function loadPreset(name: keyof typeof PRESETS) {
  const data = PRESETS[name]
  inputText.value = inputFormat.value === 'yaml' ? stringifyInputYaml(data) : formatJson(data)
}

async function copyShareUrl() {
  if (!canShareState.value)
    return

  await navigator.clipboard.writeText(window.location.href)
  hasCopiedUrl.value = true
  setTimeout(() => (hasCopiedUrl.value = false), 2000)
}

async function loadTokenizer() {
  tokenizer.value ??= await import('gpt-tokenizer')
}
</script>

<template>
  <div class="playground">
    <div class="playground-container">
      <!-- Header -->
      <header class="playground-header">
        <h1>在线体验</h1>
        <p>实时将 JSON 或 YAML 转换为 TOON，并比较 token 数量。</p>
      </header>

      <!-- Options Bar -->
      <div class="options-bar">
        <VPInput id="inputFormat" label="输入格式">
          <select id="inputFormat" v-model="inputFormat">
            <option value="json">
              JSON
            </option>
            <option value="yaml">
              YAML
            </option>
          </select>
        </VPInput>

        <VPInput id="delimiter" label="分隔符">
          <select id="delimiter" v-model="delimiter">
            <option v-for="opt in DELIMITER_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </VPInput>

        <VPInput id="indent" label="缩进">
          <input
            id="indent"
            v-model.number="indent"
            type="number"
            min="0"
            max="8"
          >
        </VPInput>

        <VPInput id="keyFolding" label="键折叠">
          <select id="keyFolding" v-model="keyFolding">
            <option value="off">
              关闭
            </option>
            <option value="safe">
              安全
            </option>
          </select>
        </VPInput>

        <VPInput id="flattenDepth" label="展开深度">
          <input
            id="flattenDepth"
            v-model.number="flattenDepth"
            type="number"
            min="1"
            max="10"
            :disabled="keyFolding === 'off'"
          >
        </VPInput>

        <VPInput id="preset" label="示例">
          <select id="preset" @change="(e) => loadPreset((e.target as HTMLSelectElement).value as keyof typeof PRESETS)">
            <option value="" disabled selected>
              加载示例...
            </option>
            <option value="hikes">
              Hikes（混合结构）
            </option>
            <option value="hikesZh">
              徒步记录（混合结构）
            </option>
            <option value="orders">
              Orders（嵌套对象）
            </option>
            <option value="ordersZh">
              订单（嵌套对象）
            </option>
            <option value="metrics">
              Metrics（表格数据）
            </option>
            <option value="metricsZh">
              指标（表格数据）
            </option>
            <option value="events">
              Events（半一致结构）
            </option>
            <option value="eventsZh">
              事件日志（半一致结构）
            </option>
          </select>
        </VPInput>

        <VPInput v-if="inputFormat === 'json'" id="jsonFormat" label="JSON 基线">
          <select id="jsonFormat" v-model="jsonFormat">
            <option v-for="opt in JSON_FORMAT_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </VPInput>

        <button
          class="share-button"
          :class="[hasCopiedUrl && 'copied']"
          :aria-label="
            !canShareState
              ? '当前内容过大，无法通过 URL 分享'
              : hasCopiedUrl
                ? '链接已复制'
                : '复制可分享链接'
          "
          :title="!canShareState ? '当前内容过大，无法通过 URL 分享' : undefined"
          :disabled="!canShareState"
          :aria-disabled="!canShareState"
          @click="copyShareUrl"
        >
          <span class="vpi-link" :class="[hasCopiedUrl && 'check']" aria-hidden="true" />
          <template v-if="!canShareState">
            内容过大
          </template>
          <template v-else>
            {{ hasCopiedUrl ? '已复制' : '分享' }}
          </template>
        </button>
      </div>

      <!-- Editor Container -->
      <div class="editor-container">
        <!-- Input -->
        <div class="editor-pane">
          <div class="pane-header">
            <span class="pane-title">{{ inputFormat === 'yaml' ? 'YAML 输入' : 'JSON 输入' }}</span>
            <span class="pane-stats">
              <span class="stat-primary" title="格式化输入的 token 数量">{{ inputTokens ?? '…' }} tokens</span>
              <span class="stat-secondary">{{ formattedInput.length }} 字符</span>
            </span>
          </div>
          <textarea
            id="input"
            v-model="inputText"
            class="editor-textarea"
            spellcheck="false"
            :aria-label="inputFormat === 'yaml' ? 'YAML 输入' : 'JSON 输入'"
            :aria-describedby="error ? 'parse-error' : undefined"
            :aria-invalid="!!error"
            :placeholder="inputFormat === 'yaml' ? '在此输入 YAML...' : '在此输入 JSON...'"
          />
        </div>

        <!-- TOON Output -->
        <div class="editor-pane">
          <div class="pane-header">
            <span class="pane-title">
              TOON 输出
              <span v-if="tokenSavings" class="savings-badge" :class="[!tokenSavings.isSavings && 'increase']">
                {{ tokenSavings.sign }}{{ tokenSavings.percent }}%
              </span>
            </span>
            <span class="pane-stats">
              <span class="stat-primary">{{ toonTokens ?? '…' }} tokens</span>
              <span class="stat-secondary">{{ toonOutput.length }} 字符</span>
            </span>
          </div>
          <div class="editor-output">
            <button
              v-if="!error"
              class="copy-button"
              :class="[copied && 'copied']"
              :aria-label="copied ? '已复制到剪贴板' : '复制到剪贴板'"
              :aria-pressed="copied"
              @click="copy()"
            />
            <pre v-if="!error"><code>{{ toonOutput }}</code></pre>
            <div v-else id="parse-error" role="alert" class="error-message">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground {
  padding: 32px 24px 32px;
}

@media (min-width: 768px) {
  .playground {
    padding: 48px 32px 48px;
  }
}

@media (min-width: 960px) {
  .playground {
    padding: 48px 32px 48px;
  }
}

.playground-container {
  max-width: 1400px;
  margin: 0 auto;
}

.playground-header {
  margin-bottom: 24px;
}

.playground-header h1 {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 40px;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
}

@media (min-width: 768px) {
  .playground-header h1 {
    font-size: 32px;
  }
}

.playground-header p {
  font-size: 16px;
  line-height: 28px;
  color: var(--vp-c-text-2);
}

.options-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

@media (max-width: 768px) {
  .options-bar {
    gap: 8px;
  }
}

.vpi-link {
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3C/svg%3E");
  display: inline-block;
  width: 1em;
  height: 1em;
  -webkit-mask: var(--icon) no-repeat;
  mask: var(--icon) no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  background-color: currentColor;
}

.vpi-link.check {
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E");
}

.share-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 32px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  transition: border-color 0.25s, color 0.25s;
  margin-left: auto;
}

.share-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.share-button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.share-button.copied {
  border-color: var(--vp-c-green-1);
  color: var(--vp-c-green-1);
}

.share-button:disabled {
  color: var(--vp-c-text-3);
  border-color: var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  cursor: not-allowed;
}

.editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .editor-container {
    grid-template-columns: 1fr;
  }
}

.editor-pane {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.25s;
}

@media (max-width: 768px) {
  .editor-pane {
    min-height: 400px;
  }
}

.editor-pane:focus-within {
  border-color: var(--vp-c-brand-1);
}

.pane-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
}

.pane-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

.pane-stats {
  display: flex;
  gap: 12px;
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
  text-transform: none;
  letter-spacing: normal;
}

.stat-primary {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.stat-secondary {
  color: var(--vp-c-text-3);
}

.savings-badge {
  display: inline-flex;
  padding: 2px 6px;
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--vp-c-green-1);
  background: var(--vp-c-green-soft);
  border-radius: 4px;
  text-transform: none;
  letter-spacing: normal;
}

.savings-badge.increase {
  color: var(--vp-c-yellow-1);
  background: var(--vp-c-yellow-soft);
}

.copy-button {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  border: 1px solid var(--vp-code-copy-code-border-color);
  border-radius: 4px;
  width: 40px;
  height: 40px;
  background-color: var(--vp-code-copy-code-bg);
  opacity: 0;
  cursor: pointer;
  background-image: var(--vp-icon-copy);
  background-position: 50%;
  background-size: 20px;
  background-repeat: no-repeat;
  transition: border-color 0.25s, background-color 0.25s, opacity 0.25s;
}

.editor-output:hover .copy-button,
.copy-button:focus {
  opacity: 1;
}

.copy-button:hover:not(:disabled),
.copy-button.copied {
  border-color: var(--vp-code-copy-code-hover-border-color);
  background-color: var(--vp-code-copy-code-hover-bg);
}

.copy-button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.copy-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.copy-button.copied,
.copy-button:hover.copied {
  border-radius: 0 4px 4px 0;
  background-image: var(--vp-icon-copied);
}

.copy-button.copied::before,
.copy-button:hover.copied::before {
  position: relative;
  top: -1px;
  transform: translateX(calc(-100% - 1px));
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--vp-code-copy-code-hover-border-color);
  border-right: 0;
  border-radius: 4px 0 0 4px;
  padding: 0 10px;
  width: fit-content;
  height: 40px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-code-copy-code-active-text);
  background-color: var(--vp-code-copy-code-hover-bg);
  white-space: nowrap;
  content: var(--vp-code-copy-copied-text-content);
}

.copy-button[aria-pressed="true"] {
  opacity: 1;
}

.editor-textarea,
.editor-output {
  flex: 1;
  padding: 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  line-height: 1.7;
}

.editor-textarea {
  resize: none;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.editor-output {
  position: relative;
  overflow: auto;
  background: var(--vp-code-block-bg);
}

.editor-output pre {
  margin: 0;
  white-space: pre;
}

.error-message {
  color: var(--vp-c-danger-1);
  padding: 8px 12px;
  background: var(--vp-c-danger-soft);
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: var(--vp-font-family-base);
}
</style>
