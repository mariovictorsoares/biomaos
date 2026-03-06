<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Novo Usuário</h2>
            <p class="text-sm text-gray-500 mt-0.5">Adicione um novo usuário ao sistema</p>
          </div>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-5 space-y-5">
          <!-- Avatar Preview -->
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <span class="text-xl font-semibold text-white">{{ avatarInitials }}</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">Foto do Perfil</p>
              <button class="text-sm text-green-600 hover:text-green-700 font-medium mt-1">
                Fazer upload
              </button>
            </div>
          </div>

          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Nome Completo <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="form.nome"
              placeholder="Digite o nome completo"
              :class="['input', attempted && !form.nome ? 'border-red-500' : '']"
            />
            <span v-if="attempted && !form.nome" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              E-mail <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              v-model="form.email"
              placeholder="Digite o e-mail"
              :class="['input', attempted && !form.email ? 'border-red-500' : '']"
            />
            <span v-if="attempted && !form.email" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
          </div>

          <!-- Grid 2 colunas -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Perfil -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Perfil <span class="text-red-500">*</span>
              </label>
              <select v-model="form.role" :class="['input', attempted && !form.role ? 'border-red-500' : '']">
                <option value="">Selecione...</option>
                <option value="admin">Administrador</option>
                <option value="manager">Gerente</option>
                <option value="operator">Operador</option>
                <option value="viewer">Visualizador</option>
              </select>
              <span v-if="attempted && !form.role" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select v-model="form.status" class="input">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <!-- Empresa -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Empresa <span class="text-red-500">*</span>
            </label>
            <select v-model="form.empresa" :class="['input', attempted && !form.empresa ? 'border-red-500' : '']">
              <option value="">Selecione uma empresa...</option>
              <option value="Fazendas Bioma">Fazendas Bioma</option>
              <option value="AgroVerde Sustentável">AgroVerde Sustentável</option>
              <option value="Terra Viva Agricultura">Terra Viva Agricultura</option>
              <option value="EcoPastos do Brasil">EcoPastos do Brasil</option>
              <option value="Grupo Natureza">Grupo Natureza</option>
              <option value="Campos Verdes Ltda">Campos Verdes Ltda</option>
            </select>
            <span v-if="attempted && !form.empresa" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
          </div>

          <!-- Senha -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Senha <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.senha"
                placeholder="Digite uma senha"
                :class="['input pr-10', attempted && !form.senha ? 'border-red-500' : '']"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
              </button>
            </div>
            <span v-if="attempted && !form.senha" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
            <p v-else class="text-xs text-gray-500 mt-1.5">Mínimo de 8 caracteres</p>
          </div>

          <!-- Notificações -->
          <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="sendInvite"
              v-model="form.sendInvite"
              class="w-4 h-4 mt-0.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label for="sendInvite" class="text-sm">
              <span class="font-medium text-gray-900">Enviar convite por e-mail</span>
              <p class="text-gray-500 mt-0.5">O usuário receberá um e-mail com instruções para acessar o sistema</p>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            @click="$emit('close')"
            class="btn btn-secondary"
          >
            Cancelar
          </button>
          <button @click="handleSave" class="btn btn-primary">
            Criar Usuário
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineEmits(['close'])

const showPassword = ref(false)
const attempted = ref(false)

const form = ref({
  nome: '',
  email: '',
  role: '',
  status: 'active',
  empresa: '',
  senha: '',
  sendInvite: true
})

const handleSave = () => {
  attempted.value = true
  if (!form.value.nome || !form.value.email || !form.value.role || !form.value.empresa || !form.value.senha) {
    return
  }
  // TODO: implementar lógica de criação de usuário
}

const avatarInitials = computed(() => {
  if (!form.value.nome) return 'NU'
  return form.value.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})
</script>
