<template>
  <div class="grid grid-cols-2 gap-3">
    <div
      v-for="(image, index) in images"
      :key="index"
      class="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <div class="aspect-square bg-[#f5f5f0] flex items-center justify-center p-4">
        <div
          class="w-full h-full rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: image.bgColor }"
        >
          <div class="text-center">
            <div
              class="w-16 h-20 mx-auto mb-2 rounded-sm"
              :style="{
                background: `linear-gradient(to top, ${image.baseColor} 30%, ${image.topColor} 70%)`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }"
            ></div>
            <span class="text-xs text-gray-600 font-medium">{{ image.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const images = [
  {
    name: 'Repolho Roxo',
    bgColor: '#faf5f5',
    baseColor: '#d4a574',
    topColor: '#8b2d5b'
  },
  {
    name: 'Rabanete',
    bgColor: '#faf5f5',
    baseColor: '#d4a574',
    topColor: '#2d5a2d'
  },
  {
    name: 'Beterraba',
    bgColor: '#faf5f5',
    baseColor: '#d4a574',
    topColor: '#c94a5a'
  },
  {
    name: 'Alho Poro',
    bgColor: '#faf5f5',
    baseColor: '#d4a574',
    topColor: '#7ab55c'
  },
  {
    name: 'Mostarda',
    bgColor: '#faf5f5',
    baseColor: '#d4a574',
    topColor: '#4a8b4a'
  },
  {
    name: 'Couve',
    bgColor: '#faf5f5',
    baseColor: '#d4a574',
    topColor: '#3d6b3d'
  }
]
</script>
