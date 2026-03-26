<script setup>
defineProps({
  modelValue: { type: String, default: 'amber' }
})
defineEmits(['update:modelValue'])

const colors = [
  { id: 'amber', bgClass: 'bg-yellow-400' },
  { id: 'sky', bgClass: 'bg-sky-400' },
  { id: 'emerald', bgClass: 'bg-emerald-400' },
  { id: 'violet', bgClass: 'bg-violet-400' },
  { id: 'pink', bgClass: 'bg-pink-400' }
]
</script>

<template>
  <div class="mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-8">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-black tracking-widest text-zinc-400">ACCENT COLOR</h3>
    </div>
    <div class="flex flex-wrap gap-4">
      <button 
        v-for="color in colors" 
        :key="color.id"
        type="button"
        @click="$emit('update:modelValue', color.id)"
        :class="[
          'w-10 h-10 rounded-2xl transition-all shadow-md',
          color.bgClass,
          modelValue === color.id 
            ? 'ring-4 ring-offset-2 ring-zinc-900 dark:ring-white scale-110' 
            : 'opacity-70 hover:opacity-100'
        ]"
      ></button>
    </div>
  </div>
</template>