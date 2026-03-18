<template>
  <div class="min-h-screen relative overflow-hidden" :class="isMobile ? 'bg-white' : 'bg-[#0a1a06]'">
    <!-- Background image (desktop) -->
    <template v-if="!isMobile">
      <img
        src="/images/auth/bg-fazenda.jpg"
        alt=""
        class="absolute inset-0 w-full h-full object-cover transition-all duration-[1.8s] ease-out"
        :class="mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'"
        draggable="false"
      />
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0a1a06]/40 via-transparent to-[#0a1a06]/20"></div>
    </template>

    <!-- Content -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-8">
      <!-- Card centralizado -->
      <div
        class="w-full max-w-[420px] transition-all duration-700 delay-300"
        :class="mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
      >
        <div :class="isMobile ? '' : 'bg-white rounded-2xl shadow-2xl shadow-black/25 px-8 sm:px-10 py-10 ring-1 ring-white/10 min-h-[480px]'">
          <!-- Logo dentro do card -->
          <div class="mb-8">
            <img
              src="/images/logo-biomaos.png"
              alt="BiomaOS"
              class="h-8 w-auto"
            />
          </div>

          <!-- Page content com transição -->
          <slot />
        </div>
      </div>

      <!-- Footer -->
      <p
        class="text-[11px] mt-6 transition-all duration-500 delay-[800ms]"
        :class="[
          mounted ? 'opacity-100' : 'opacity-0',
          isMobile ? 'text-gray-400' : 'text-white/35'
        ]"
      >
        &copy; {{ new Date().getFullYear() }} Fazendas Bioma
      </p>
    </div>

    <!-- Toast Global -->
    <Toast />
  </div>
</template>

<script setup>
const mounted = ref(false)
const isMobile = ref(true)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  requestAnimationFrame(() => {
    mounted.value = true
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>
