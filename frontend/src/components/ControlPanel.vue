<script setup lang="ts">
import { ref } from 'vue'
import { useFluidStore } from '../store/fluid'
import { PRESETS, EXPERIMENT_PRESETS } from '../utils/sph-engine'
import type { Preset, ExperimentPreset } from '../types'

const store = useFluidStore()
const activeTab = ref<'normal' | 'experiment'>('normal')

function selectPreset(preset: Preset) {
  if (store.isExperimentMode) {
    store.stopExperiment()
  }
  store.initSimulation(preset)
}

function selectExperiment(exp: ExperimentPreset) {
  store.startExperiment(exp)
}

function toggleRun() {
  if (store.isRunning) {
    store.stop()
  } else {
    if (store.isExperimentMode) {
      if (store.currentExperiment) {
        store.startExperiment(store.currentExperiment)
      }
    } else {
      store.start()
    }
  }
}

function reset() {
  if (store.isExperimentMode) {
    store.resetExperiment()
  } else {
    store.reset()
  }
}

function stepOnce() {
  store.stepOnce()
}

function exitExperiment() {
  store.stopExperiment()
  store.initSimulation(store.currentPreset)
}

function onGravity(e: Event) {
  store.updateParam('gravity', parseFloat((e.target as HTMLInputElement).value))
}
function onViscosity(e: Event) {
  store.updateParam('viscosity', parseFloat((e.target as HTMLInputElement).value))
}
function onSmoothingRadius(e: Event) {
  store.updateParam('smoothingRadius', parseFloat((e.target as HTMLInputElement).value))
}
function onParticleCount(e: Event) {
  store.particleCount = parseInt((e.target as HTMLInputElement).value)
}
function onDt(e: Event) {
  store.updateParam('dt', parseFloat((e.target as HTMLInputElement).value))
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="w-72 bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col gap-4 overflow-auto h-full">
    <!-- Mode Tabs -->
    <div class="flex bg-gray-900 rounded-lg p-1">
      <button
        @click="activeTab = 'normal'"
        class="flex-1 py-1.5 text-xs font-medium rounded transition"
        :class="activeTab === 'normal' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'"
      >
        自由模拟
      </button>
      <button
        @click="activeTab = 'experiment'"
        class="flex-1 py-1.5 text-xs font-medium rounded transition"
        :class="activeTab === 'experiment' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'"
      >
        实验评分
      </button>
    </div>

    <!-- Normal Mode Content -->
    <template v-if="activeTab === 'normal'">
      <!-- Presets -->
      <div>
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">预设场景</h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="preset in PRESETS"
            :key="preset.name"
            @click="selectPreset(preset)"
            class="text-xs px-2 py-2 rounded transition text-left"
            :class="!store.isExperimentMode && store.currentPreset.name === preset.name
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
          >
            {{ preset.label }}
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1">{{ store.currentPreset.description }}</p>
      </div>
    </template>

    <!-- Experiment Mode Content -->
    <template v-else>
      <div>
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">实验任务</h3>
        <div class="space-y-2">
          <button
            v-for="exp in EXPERIMENT_PRESETS"
            :key="exp.id"
            @click="selectExperiment(exp)"
            class="w-full text-xs px-3 py-2 rounded transition text-left"
            :class="store.isExperimentMode && store.currentExperiment?.id === exp.id
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
          >
            <div class="font-medium">{{ exp.label }}</div>
            <div class="text-gray-400 text-[11px] mt-0.5" :class="store.isExperimentMode && store.currentExperiment?.id === exp.id ? 'text-purple-200' : ''">
              {{ exp.description }}
            </div>
          </button>
        </div>
      </div>

      <!-- Experiment Results -->
      <div v-if="store.isExperimentMode && store.experimentResult" class="bg-gray-900 rounded-lg p-3 space-y-3">
        <h4 class="text-xs font-semibold text-purple-400 uppercase tracking-wider">实验结果</h4>

        <!-- Completion Progress -->
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-400">完成度</span>
            <span class="font-mono font-bold" :class="store.experimentCompleted ? 'text-green-400' : 'text-yellow-400'">
              {{ store.experimentResult.completion.toFixed(1) }}%
            </span>
          </div>
          <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-200"
              :class="store.experimentCompleted ? 'bg-green-500' : 'bg-yellow-500'"
              :style="{ width: Math.min(store.experimentResult.completion, 100) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Elapsed Time -->
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-400">耗时</span>
            <span class="text-blue-400 font-mono font-bold">
              {{ formatTime(store.experimentElapsedTime) }}
            </span>
          </div>
          <div v-if="store.currentExperiment?.timeLimit" class="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 rounded-full transition-all duration-200"
              :style="{ width: Math.min((store.experimentElapsedTime / store.currentExperiment.timeLimit) * 100, 100) + '%' }"
            ></div>
          </div>
          <p v-if="store.currentExperiment?.timeLimit" class="text-[11px] text-gray-500 mt-1">
            时限: {{ formatTime(store.currentExperiment.timeLimit) }}
          </p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-700">
          <div>
            <span class="text-gray-500">目标内粒子</span>
            <p class="text-green-400 font-mono text-sm">{{ store.experimentResult.particlesInTarget }}</p>
          </div>
          <div>
            <span class="text-gray-500">总粒子数</span>
            <p class="text-blue-400 font-mono text-sm">{{ store.experimentResult.totalParticles }}</p>
          </div>
        </div>

        <!-- Status Badge -->
        <div class="flex items-center justify-center py-2 rounded"
          :class="store.experimentCompleted ? 'bg-green-900/50 text-green-400' : (store.experimentElapsedTime >= (store.currentExperiment?.timeLimit ?? 0) ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400')">
          <span v-if="store.experimentCompleted" class="text-sm font-bold">✓ 实验完成！</span>
          <span v-else-if="store.experimentElapsedTime >= (store.currentExperiment?.timeLimit ?? 0)" class="text-sm font-bold">⏱ 时间到</span>
          <span v-else class="text-sm">⏳ 进行中...</span>
        </div>

        <!-- Target Details -->
        <div class="space-y-2 pt-2 border-t border-gray-700">
          <p class="text-xs text-gray-400">目标详情:</p>
          <div
            v-for="target in store.experimentTargets"
            :key="target.id"
            class="flex items-center gap-2 text-xs"
          >
            <div class="w-3 h-3 rounded-sm" :style="{ backgroundColor: target.color }"></div>
            <span class="text-gray-300">{{ target.name }}</span>
            <span class="text-gray-500 ml-auto">{{ Math.round(target.targetFillRatio * 100) }}% 目标填充</span>
          </div>
        </div>
      </div>

      <!-- Exit Experiment Button -->
      <button
        v-if="store.isExperimentMode"
        @click="exitExperiment"
        class="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded text-sm transition"
      >
        退出实验模式
      </button>
    </template>

    <!-- Controls (common) -->
    <div class="flex gap-2">
      <button
        @click="toggleRun"
        class="flex-1 py-2 rounded text-sm font-medium transition"
        :class="store.isRunning
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'"
      >
        {{ store.isRunning ? '暂停' : '开始' }}
      </button>
      <button
        @click="reset"
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded text-sm transition"
      >
        重置
      </button>
      <button
        @click="stepOnce"
        :disabled="store.isRunning || store.isExperimentMode"
        class="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 py-2 rounded text-sm transition"
      >
        单步
      </button>
    </div>

    <!-- Parameters (only in normal mode) -->
    <div v-if="activeTab === 'normal'" class="space-y-3">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">模拟参数</h3>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>重力</span>
          <span class="text-gray-300">{{ store.params.gravity.toFixed(1) }}</span>
        </label>
        <input
          type="range" min="0" max="20" step="0.1"
          :value="store.params.gravity"
          @input="onGravity"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>粘性</span>
          <span class="text-gray-300">{{ store.params.viscosity.toFixed(1) }}</span>
        </label>
        <input
          type="range" min="0" max="5" step="0.1"
          :value="store.params.viscosity"
          @input="onViscosity"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>光滑半径</span>
          <span class="text-gray-300">{{ store.params.smoothingRadius.toFixed(0) }}</span>
        </label>
        <input
          type="range" min="10" max="50" step="1"
          :value="store.params.smoothingRadius"
          @input="onSmoothingRadius"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>粒子数量</span>
          <span class="text-gray-300">{{ store.particleCount }}</span>
        </label>
        <input
          type="range" min="200" max="2000" step="50"
          :value="store.particleCount"
          @input="onParticleCount"
          class="w-full accent-blue-500 h-1.5"
        />
        <p class="text-xs text-gray-600 mt-0.5">重置后生效</p>
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>时间步长</span>
          <span class="text-gray-300">{{ store.params.dt.toFixed(4) }}</span>
        </label>
        <input
          type="range" min="0.001" max="0.02" step="0.001"
          :value="store.params.dt"
          @input="onDt"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>
    </div>

    <!-- Stats -->
    <div class="mt-auto pt-3 border-t border-gray-700">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">运行状态</h3>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">FPS</span>
          <p class="text-green-400 font-mono text-sm">{{ store.fps }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">粒子数</span>
          <p class="text-blue-400 font-mono text-sm">{{ store.particleArray.length }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">平均密度</span>
          <p class="text-yellow-400 font-mono text-sm">{{ store.avgDensity.toFixed(0) }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">最大速度</span>
          <p class="text-red-400 font-mono text-sm">{{ store.maxVelocity.toFixed(1) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
