<template>
  <div class="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <svg class="animate-spin h-10 w-10 text-[#549E54] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600">Carregando contrato...</p>
      </div>
    </div>

    <!-- Erro de acesso -->
    <div v-else-if="acessoNegado" class="flex items-center justify-center min-h-[50vh]">
      <div class="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center max-w-md w-full">
        <div class="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 sm:w-8 sm:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h2 class="text-lg sm:text-xl font-bold text-gray-800 mb-2">Acesso negado</h2>
        <p class="text-sm sm:text-base text-gray-600 mb-6">Você precisa validar a chave de acesso para visualizar este contrato.</p>
        <NuxtLink
          :to="`/contrato/${route.params.id}/acesso`"
          class="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-[#549E54] text-white font-semibold rounded-lg hover:bg-[#478a47] transition-colors"
        >
          Inserir chave de acesso
        </NuxtLink>
      </div>
    </div>

    <!-- Contrato não encontrado -->
    <div v-else-if="!contrato" class="flex items-center justify-center min-h-[50vh]">
      <div class="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center max-w-md w-full">
        <div class="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h2 class="text-lg sm:text-xl font-bold text-gray-800 mb-2">Contrato não encontrado</h2>
        <p class="text-sm sm:text-base text-gray-600">O contrato solicitado não existe ou foi removido.</p>
      </div>
    </div>

    <!-- Conteúdo do Contrato -->
    <div v-else>
      <!-- Header com Logo -->
      <div class="flex items-center justify-center gap-2 mb-6 sm:mb-8">
        <div class="w-8 h-8 sm:w-10 sm:h-10 bg-[#549E54] rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <span class="text-lg sm:text-xl font-semibold text-gray-800">BiomaOS</span>
      </div>

      <!-- Contrato já aceito - Badge -->
      <div v-if="contrato.aceito_em" class="mb-6">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center gap-3">
          <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm sm:text-base text-green-800 font-medium">
            Contrato aceito em {{ formatDate(contrato.aceito_em) }}
          </span>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Conteúdo Principal -->
        <div class="flex-1 order-2 lg:order-1">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <!-- Título -->
            <div class="border-b border-gray-200 p-4 sm:p-6">
              <h1 class="text-lg sm:text-xl font-bold text-gray-800 text-center">
                Contrato de Fornecimento de Microverdes
              </h1>
            </div>

            <div class="p-4 sm:p-6 space-y-6 sm:space-y-8">
              <!-- Informações do Estabelecimento -->
              <section>
                <h2 class="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Informações do Estabelecimento</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Nome:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ cliente?.nome_fantasia || cliente?.razao_social || '-' }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">CNPJ:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ cliente?.cnpj_cpf || '-' }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Representante:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ cliente?.responsavel_pedido || '-' }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Endereço:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ enderecoCliente }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Telefone:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ cliente?.telefone || cliente?.whatsapp || '-' }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">E-mail:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800 break-all">{{ cliente?.email || '-' }}</p>
                  </div>
                </div>
              </section>

              <!-- Informações do Plano -->
              <section>
                <h2 class="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Informações do Plano</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Tipo do Plano:</span>
                    <p class="text-sm sm:text-base font-medium text-[#549E54]">{{ tipoPlanoLabel }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Início das Entregas:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ formatDate(contrato.data_inicio) }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Fim das Entregas:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ formatDate(contrato.data_fim) }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Quantidade de entregas:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ totalEntregas }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Valor do Frete:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ formatCurrency(contrato.valor_frete_entrega || 0) }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Endereço de Entrega:</span>
                    <p class="text-sm sm:text-base font-medium text-[#549E54]">{{ enderecoEntrega }}</p>
                  </div>
                  <div class="sm:col-span-2">
                    <span class="text-xs sm:text-sm text-gray-500">Forma de Pagamento:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ formaPagamentoLabel }}</p>
                  </div>
                </div>
              </section>

              <!-- Listagem de Produtos -->
              <section>
                <h2 class="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Listagem de produtos</h2>

                <div class="space-y-3">
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Quantidade de microverdes por espécie:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">{{ quantidadePorEspecie }}</p>
                  </div>
                  <div>
                    <span class="text-xs sm:text-sm text-gray-500">Quantidade total de microverdes:</span>
                    <p class="text-sm sm:text-base font-medium text-gray-800">
                      {{ totalMicroverdes }} + {{ bonificacaoQtd }} (bonificação) = {{ totalComBonificacao }}
                    </p>
                  </div>
                  <div v-if="contrato.observacoes">
                    <p class="text-xs sm:text-sm text-gray-600 italic">{{ contrato.observacoes }}</p>
                  </div>
                </div>
              </section>

              <!-- Previsão de Entrega -->
              <section>
                <h2 class="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Previsão de entrega</h2>

                <!-- Mobile: Cards -->
                <div class="sm:hidden space-y-3">
                  <div
                    v-for="(entrega, index) in previsaoEntregas"
                    :key="index"
                    class="bg-gray-50 rounded-lg p-4"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div>
                        <p class="text-sm font-medium text-gray-800">{{ formatDate(entrega.data) }}</p>
                        <p class="text-xs text-gray-500">{{ entrega.diaSemana }}</p>
                      </div>
                      <span class="inline-flex items-center justify-center w-8 h-8 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                        {{ entrega.quantidade }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">{{ entrega.produto }}</p>
                    <p class="text-sm font-semibold text-[#549E54]">{{ formatCurrency(entrega.valor) }}</p>
                  </div>
                </div>

                <!-- Desktop: Tabela -->
                <div class="hidden sm:block overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-200">
                        <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Data</th>
                        <th class="text-center py-3 px-4 text-sm font-medium text-gray-500">Qtd</th>
                        <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Produto</th>
                        <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(entrega, index) in previsaoEntregas"
                        :key="index"
                        class="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td class="py-3 px-4">
                          <div class="text-sm font-medium text-gray-800">{{ formatDate(entrega.data) }}</div>
                          <div class="text-xs text-gray-500">{{ entrega.diaSemana }}</div>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span class="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                            {{ entrega.quantidade }}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-sm text-gray-700">{{ entrega.produto }}</td>
                        <td class="py-3 px-4 text-right text-sm font-medium text-[#549E54]">
                          {{ formatCurrency(entrega.valor) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>

        <!-- Sidebar - Resumo -->
        <div class="lg:w-80 order-1 lg:order-2">
          <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-[#549E54]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-[#549E54]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="font-semibold text-gray-800 text-sm sm:text-base">Resumo do Contrato</h3>
                <p class="text-xs text-gray-500 truncate">Confira os detalhes do contrato</p>
              </div>
            </div>

            <div class="space-y-3 sm:space-y-4 pt-4 border-t border-gray-100">
              <div>
                <span class="text-xs text-gray-500">Cliente:</span>
                <p class="text-sm sm:text-base font-medium text-gray-800 truncate">{{ cliente?.nome_fantasia || cliente?.razao_social || '-' }}</p>
              </div>

              <div>
                <span class="text-xs text-gray-500">Plano:</span>
                <p class="text-sm sm:text-base font-medium text-gray-800">{{ tipoPlanoLabel }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-xs text-gray-500">Início:</span>
                  <p class="text-sm font-medium text-gray-800">{{ formatDate(contrato.data_inicio) }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-500">Fim:</span>
                  <p class="text-sm font-medium text-gray-800">{{ formatDate(contrato.data_fim) }}</p>
                </div>
              </div>

              <div class="pt-3 sm:pt-4 border-t border-gray-100">
                <span class="text-xs text-gray-500">Valor Total:</span>
                <p class="text-xl sm:text-2xl font-bold text-[#549E54]">{{ formatCurrency(valorTotal) }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-xs text-gray-500">Microverdes:</span>
                  <p class="text-sm font-medium text-gray-800">{{ formatCurrency(valorMicroverdes) }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-500">Bônus:</span>
                  <p class="text-sm font-medium text-gray-800">{{ formatCurrency(valorBonus) }}</p>
                </div>
              </div>

              <div class="pt-3 sm:pt-4 border-t border-gray-100">
                <span class="text-xs text-gray-500">Data da assinatura:</span>
                <p class="text-sm font-medium text-gray-800">{{ formatDate(contrato.created_at) }}</p>
              </div>
            </div>

            <!-- Botão Aceitar - só aparece se não foi aceito -->
            <button
              v-if="!contrato.aceito_em"
              @click="aceitarContrato"
              :disabled="aceitando"
              class="w-full mt-5 sm:mt-6 px-6 py-3 bg-[#549E54] text-white font-semibold rounded-lg hover:bg-[#478a47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg v-if="aceitando" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              {{ aceitando ? 'Processando...' : 'Aceitar Contrato' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'public'
})

const route = useRoute()
const supabase = useSupabaseClient()

const loading = ref(true)
const acessoNegado = ref(false)
const contrato = ref(null)
const itens = ref([])
const aceitando = ref(false)

// Verificar acesso
onMounted(async () => {
  const validado = sessionStorage.getItem(`contrato_${route.params.id}_validado`)
  if (!validado) {
    acessoNegado.value = true
    loading.value = false
    return
  }

  await carregarContrato()
})

async function carregarContrato() {
  try {
    // Buscar contrato com cliente
    const { data: contratoData, error: contratoError } = await supabase
      .from('contratos')
      .select(`
        *,
        clientes (
          id,
          razao_social,
          nome_fantasia,
          cnpj_cpf,
          email,
          telefone,
          whatsapp,
          responsavel_pedido,
          logradouro_entrega,
          numero_entrega,
          bairro_entrega,
          cidade_entrega,
          estado_entrega,
          cep_entrega
        )
      `)
      .eq('id', route.params.id)
      .single()

    if (contratoError) {
      console.error('Erro ao carregar contrato:', contratoError)
      return
    }

    contrato.value = contratoData

    // Buscar itens do contrato
    const { data: itensData } = await supabase
      .from('contrato_itens')
      .select(`
        *,
        produtos (
          id,
          nome,
          codigo
        )
      `)
      .eq('contrato_id', route.params.id)
      .order('data_entrega', { ascending: true })

    itens.value = itensData || []
  } catch (e) {
    console.error('Erro:', e)
  } finally {
    loading.value = false
  }
}

async function aceitarContrato() {
  if (aceitando.value) return

  aceitando.value = true

  try {
    const response = await $fetch('/api/aceitar-contrato', {
      method: 'POST',
      body: { contratoId: route.params.id }
    })

    // Atualizar local
    contrato.value.aceito_em = response.aceito_em || new Date().toISOString()
  } catch (e) {
    console.error('Erro:', e)
    alert('Erro ao aceitar contrato. Tente novamente.')
  } finally {
    aceitando.value = false
  }
}

// Computed
const cliente = computed(() => contrato.value?.clientes)

const enderecoCliente = computed(() => {
  if (!cliente.value) return '-'
  const c = cliente.value
  const partes = []
  if (c.logradouro_entrega) partes.push(c.logradouro_entrega)
  if (c.numero_entrega) partes.push(c.numero_entrega)
  if (c.bairro_entrega) partes.push(c.bairro_entrega)
  if (c.cidade_entrega) partes.push(c.cidade_entrega)
  if (c.estado_entrega) partes.push(c.estado_entrega)
  return partes.join(', ') || '-'
})

const enderecoEntrega = computed(() => {
  return enderecoCliente.value
})

const tipoPlanoLabel = computed(() => {
  if (!contrato.value) return '-'
  const tipo = contrato.value.tipo_plano
  const modalidade = contrato.value.modalidade

  const tipoLabels = {
    'clube_bioma_light': 'Clube Bioma Light',
    'clube_bioma_pro': 'Clube Bioma Pro',
    'pedido_recorrente': 'Pedido Recorrente'
  }

  const modalidadeLabels = {
    'recorrente': 'Recorrente',
    'mensal': 'Mensal',
    'trimestral': 'Trimestral',
    'semestral': 'Semestral'
  }

  const tipoLabel = tipoLabels[tipo] || tipo || '-'
  const modalidadeLabel = modalidadeLabels[modalidade] || modalidade || ''

  return modalidadeLabel ? `${tipoLabel} - ${modalidadeLabel}` : tipoLabel
})

const formaPagamentoLabel = computed(() => {
  if (!contrato.value?.forma_pagamento) return '-'
  const formas = {
    'pix': 'PIX',
    'boleto': 'Boleto',
    'boleto_1x': 'Boleto 1x',
    'boleto_2x': 'Boleto 2x',
    'boleto_3x': 'Boleto 3x',
    'cartao_credito': 'Cartão de Crédito',
    'transferencia': 'Transferência Bancária'
  }
  return formas[contrato.value.forma_pagamento] || contrato.value.forma_pagamento
})

const totalEntregas = computed(() => {
  const entregas = new Set()
  itens.value.forEach(item => {
    if (item.data_entrega) {
      entregas.add(item.data_entrega)
    }
  })
  return entregas.size || '-'
})

const quantidadePorEspecie = computed(() => {
  const totais = {}
  itens.value.forEach(item => {
    const nome = item.produtos?.nome || 'Produto'
    totais[nome] = (totais[nome] || 0) + (item.quantidade || 0)
  })

  return Object.entries(totais)
    .map(([nome, qtd]) => `${qtd} - ${nome}`)
    .join(', ') || '-'
})

const totalMicroverdes = computed(() => {
  return itens.value.reduce((sum, item) => sum + (item.quantidade || 0), 0)
})

const bonificacaoQtd = computed(() => {
  const bonificacao = contrato.value?.bonificacao || 0
  return Math.floor(totalMicroverdes.value * (bonificacao / 100))
})

const totalComBonificacao = computed(() => {
  return totalMicroverdes.value + bonificacaoQtd.value
})

const valorMicroverdes = computed(() => {
  return itens.value.reduce((sum, item) => {
    return sum + ((item.quantidade || 0) * (item.valor_unitario || 0))
  }, 0)
})

const valorBonus = computed(() => {
  return 0 // Bônus geralmente não tem valor adicional
})

const valorTotal = computed(() => {
  const frete = (contrato.value?.valor_frete_entrega || 0) * (totalEntregas.value || 0)
  return valorMicroverdes.value + frete - (contrato.value?.valor_credito || 0)
})

const previsaoEntregas = computed(() => {
  const entregas = []
  const datasAgrupadas = {}

  itens.value.forEach(item => {
    if (!item.data_entrega) return

    const data = item.data_entrega
    if (!datasAgrupadas[data]) {
      datasAgrupadas[data] = {
        data,
        diaSemana: getDiaSemana(data),
        produtos: [],
        quantidade: 0,
        valor: 0
      }
    }

    datasAgrupadas[data].produtos.push(item.produtos?.nome || 'Produto')
    datasAgrupadas[data].quantidade += item.quantidade || 0
    datasAgrupadas[data].valor += (item.quantidade || 0) * (item.valor_unitario || 0)
  })

  Object.values(datasAgrupadas)
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .forEach(e => {
      entregas.push({
        ...e,
        produto: e.produtos.join(', ')
      })
    })

  return entregas
})

// Funções auxiliares
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

function getDiaSemana(dateStr) {
  const date = new Date(dateStr)
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return dias[date.getUTCDay()]
}
</script>
