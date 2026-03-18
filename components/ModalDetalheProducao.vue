<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-[70] overflow-y-auto">
        <div class="fixed inset-0 glass-backdrop" @click="emit('close')"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="show" class="relative z-[71] glass-panel rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
                <div class="flex items-center gap-3 min-w-0">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark truncate">
                    Produção #{{ codigoProducao }}
                  </h2>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold shrink-0',
                      local.tipo === 'mix'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    ]"
                  >
                    {{ local.tipo === 'mix' ? 'Mix' : 'Simples' }}
                  </span>
                  <span
                    v-if="local.recorrente"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shrink-0"
                  >
                    <span class="material-icons-outlined text-xs">repeat</span>
                    Recorrente
                  </span>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span :class="['inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border', statusBadgeClass(local.status)]">
                    <span class="material-icons-outlined text-sm">{{ PRODUCAO_STATUS_CONFIG[local.status]?.icon || 'help' }}</span>
                    {{ PRODUCAO_STATUS_CONFIG[local.status]?.label || local.status }}
                  </span>
                  <button @click="emit('close')" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span class="material-icons-outlined text-xl text-gray-500 dark:text-gray-400">close</span>
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 overflow-y-auto">

                <!-- PIPELINE STEPPER -->
                <div class="px-6 py-5">
                  <div class="hidden sm:flex items-start">
                    <template v-for="(step, i) in pipelineSteps" :key="step.key">
                      <div
                        class="flex flex-col items-center"
                        style="min-width: 80px;"
                        :class="{ 'cursor-pointer': step.completed || step.current }"
                        @click="handleStepClick(step)"
                      >
                        <div
                          :class="[
                            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all text-sm',
                            step.completed
                              ? 'bg-[#4A7C59] border-[#4A7C59] text-white'
                              : step.current
                                ? 'border-[#4A7C59] text-[#4A7C59] bg-[#4A7C59]/10'
                                : step.cancelled
                                  ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500',
                            selectedStep === step.key ? 'ring-2 ring-offset-2 ring-[#4A7C59] dark:ring-offset-gray-900' : '',
                            (step.completed || step.current) ? 'hover:ring-2 hover:ring-offset-2 hover:ring-[#4A7C59]/50 dark:hover:ring-offset-gray-900' : ''
                          ]"
                        >
                          <span class="material-icons-outlined text-lg">{{ step.completed ? 'check' : step.icon }}</span>
                        </div>
                        <div
                          class="text-center text-xs mt-1.5"
                          :class="step.current ? 'text-[#4A7C59] font-medium' : 'text-gray-500 dark:text-gray-400'"
                        >
                          {{ step.label }}
                          <div v-if="step.date" class="text-[10px] text-gray-400 dark:text-gray-500">{{ formatDate(step.date) }}</div>
                        </div>
                      </div>
                      <div
                        v-if="i < pipelineSteps.length - 1"
                        :class="['flex-1 h-0.5 mt-5 mx-1', step.completed ? 'bg-[#4A7C59]' : 'bg-gray-300 dark:bg-gray-600']"
                      />
                    </template>
                  </div>
                  <!-- Mobile -->
                  <div class="sm:hidden space-y-3">
                    <div
                      v-for="step in pipelineSteps"
                      :key="step.key"
                      class="flex items-center gap-3"
                      :class="{ 'cursor-pointer': step.completed || step.current }"
                      @click="handleStepClick(step)"
                    >
                      <div
                        :class="[
                          'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs shrink-0',
                          step.completed
                            ? 'bg-[#4A7C59] border-[#4A7C59] text-white'
                            : step.current
                              ? 'border-[#4A7C59] text-[#4A7C59] bg-[#4A7C59]/10'
                              : step.cancelled
                                ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500',
                          selectedStep === step.key ? 'ring-2 ring-offset-2 ring-[#4A7C59] dark:ring-offset-gray-900' : ''
                        ]"
                      >
                        <span class="material-icons-outlined text-sm">{{ step.completed ? 'check' : step.icon }}</span>
                      </div>
                      <div>
                        <span class="text-xs" :class="step.current ? 'text-[#4A7C59] font-medium' : 'text-gray-500 dark:text-gray-400'">
                          {{ step.label }}
                        </span>
                        <span v-if="step.date" class="text-[10px] text-gray-400 dark:text-gray-500 ml-2">{{ formatDate(step.date) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- STEP DETAIL PANEL (when clicking a completed step) -->
                <Transition
                  enter-active-class="transition-all duration-200"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-all duration-150"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-1"
                >
                  <div v-if="selectedStep" class="mx-6 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark rounded-lg text-xs space-y-2">

                    <!-- Header com botao editar -->
                    <div v-if="canEditSelectedStep" class="flex items-center justify-end -mt-1 -mr-1">
                      <button
                        @click="toggleEditStep"
                        class="text-[11px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors"
                        :class="editingStep
                          ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'"
                      >
                        <span class="material-icons-outlined text-xs">{{ editingStep ? 'close' : 'edit' }}</span>
                        {{ editingStep ? 'Cancelar' : 'Editar' }}
                      </button>
                    </div>

                    <!-- === READ-ONLY VIEWS === -->
                    <template v-if="!editingStep">
                      <template v-if="selectedStep === 'planejado'">
                        <div class="flex flex-wrap gap-x-5 gap-y-1 text-subtext-light dark:text-subtext-dark">
                          <span>Fazenda: <span class="font-medium text-text-light dark:text-text-dark">{{ local.fazendas?.nome || '-' }}</span></span>
                          <span>Qtd: <span class="font-medium text-text-light dark:text-text-dark">{{ local.quantidade_planejada }}</span></span>
                        </div>
                        <div v-for="pe in local.producao_especies" :key="pe.especie_id" class="flex items-center gap-2">
                          <span class="material-icons-outlined text-[#4A7C59] text-sm">eco</span>
                          <span class="font-medium text-text-light dark:text-text-dark">{{ pe.especies?.nome }}</span>
                          <span v-if="pe.lotes_sementes" class="text-subtext-light dark:text-subtext-dark">#{{ pe.lotes_sementes.numero }}</span>
                          <span class="text-subtext-light dark:text-subtext-dark ml-auto">{{ pe.quantidade_planejada }} planejadas</span>
                        </div>
                        <div class="flex gap-4 text-subtext-light dark:text-subtext-dark pt-1 border-t border-border-light/50 dark:border-border-dark/50">
                          <span>Plantio prev: <span class="font-medium text-text-light dark:text-text-dark">{{ formatDate(local.data_plantio_prevista) }}</span></span>
                          <span>Luz prev: <span class="font-medium text-text-light dark:text-text-dark">{{ formatDate(local.data_luz_prevista) }}</span></span>
                          <span>Colheita prev: <span class="font-medium text-text-light dark:text-text-dark">{{ formatDate(local.data_colheita_prevista) }}</span></span>
                        </div>
                      </template>
                      <template v-else-if="selectedStep === 'germinando'">
                        <div class="text-subtext-light dark:text-subtext-dark">
                          Plantio em <span class="font-medium text-text-light dark:text-text-dark">{{ formatDate(local.data_plantio_real) }}</span>
                        </div>
                        <div v-for="pe in local.producao_especies" :key="pe.especie_id" class="flex items-center gap-2">
                          <span class="material-icons-outlined text-amber-500 text-sm">grass</span>
                          <span class="font-medium text-text-light dark:text-text-dark">{{ pe.especies?.nome }}</span>
                          <span class="text-subtext-light dark:text-subtext-dark ml-auto">{{ pe.quantidade_plantada }} plantadas</span>
                        </div>
                      </template>
                      <template v-else-if="selectedStep === 'luz'">
                        <div class="text-subtext-light dark:text-subtext-dark">
                          Luz em <span class="font-medium text-text-light dark:text-text-dark">{{ formatDate(local.data_luz_real) }}</span>
                        </div>
                        <div v-for="pe in local.producao_especies" :key="pe.especie_id" class="flex items-center gap-2">
                          <span class="material-icons-outlined text-yellow-500 text-sm">wb_sunny</span>
                          <span class="font-medium text-text-light dark:text-text-dark">{{ pe.especies?.nome }}</span>
                          <span class="ml-auto">
                            <span class="text-green-600 dark:text-green-400">{{ pe.quantidade_germinada || 0 }} germ.</span>
                            <span v-if="pe.perda_germinacao > 0" class="text-red-500 ml-2">-{{ pe.perda_germinacao }} perda</span>
                          </span>
                        </div>
                      </template>
                      <template v-else-if="selectedStep === 'colhendo'">
                        <div v-if="colheitasOrdenadas.length > 0" class="space-y-1">
                          <div v-for="colheita in colheitasOrdenadas" :key="colheita.id" class="flex items-center gap-3 py-0.5">
                            <span class="text-subtext-light dark:text-subtext-dark whitespace-nowrap">{{ formatDateTime(colheita.created_at) }}</span>
                            <span class="font-medium text-text-light dark:text-text-dark">{{ colheita.especies?.nome || '-' }}</span>
                            <span class="font-medium text-text-light dark:text-text-dark ml-auto whitespace-nowrap">{{ colheita.quantidade }} und</span>
                            <button @click="iniciarEdicaoColheita(colheita)" class="text-primary hover:text-primary/80 text-[10px] flex items-center gap-0.5">
                              <span class="material-icons-outlined text-[10px]">edit</span>
                            </button>
                          </div>
                          <!-- Inline edit colheita -->
                          <div v-if="editingColheitaId" class="flex items-end gap-3 flex-wrap pt-1 border-t border-border-light/50 dark:border-border-dark/50">
                            <div>
                              <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Data</label>
                              <input type="date" v-model="editColheitaForm.data_colheita" class="input text-sm w-36" />
                            </div>
                            <div>
                              <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Quantidade</label>
                              <input type="number" v-model.number="editColheitaForm.quantidade" min="0" class="input text-sm w-20 text-center" />
                            </div>
                            <button @click="salvarEdicaoColheita" class="btn btn-sm btn-primary flex items-center gap-1" :disabled="saving">
                              <span class="material-icons-outlined text-sm">save</span> Salvar
                            </button>
                            <button @click="editingColheitaId = null" class="btn btn-sm text-xs">Cancelar</button>
                          </div>
                        </div>
                        <div v-else class="text-subtext-light dark:text-subtext-dark">Nenhuma colheita registrada</div>
                      </template>
                      <template v-else-if="selectedStep === 'finalizado'">
                        <div class="text-subtext-light dark:text-subtext-dark">
                          Finalizado em <span class="font-medium text-text-light dark:text-text-dark">{{ formatDate(local.data_finalizado) }}</span>
                        </div>
                        <div v-for="pe in local.producao_especies" :key="pe.especie_id" class="flex items-center gap-2">
                          <span class="material-icons-outlined text-green-500 text-sm">check_circle</span>
                          <span class="font-medium text-text-light dark:text-text-dark">{{ pe.especies?.nome }}</span>
                          <span class="ml-auto text-subtext-light dark:text-subtext-dark">
                            Plan {{ pe.quantidade_planejada }}
                            <span class="mx-1">&middot;</span> Plant {{ pe.quantidade_plantada || 0 }}
                            <span class="mx-1">&middot;</span> Germ {{ pe.quantidade_germinada || 0 }}
                            <span class="mx-1">&middot;</span> Colh {{ pe.total_colhido || 0 }}
                            <template v-if="calcPerdaFinal(pe) > 0">
                              <span class="mx-1">&middot;</span> <span class="text-red-500">-{{ calcPerdaFinal(pe) }}</span>
                            </template>
                          </span>
                        </div>
                      </template>
                    </template>

                    <!-- === EDIT FORMS === -->
                    <template v-else>
                      <!-- Edit plantio (germinando step) -->
                      <template v-if="editingStep === 'planejado'">
                        <div class="flex items-end gap-3 flex-wrap">
                          <div>
                            <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Data plantio</label>
                            <input type="date" v-model="editPlantioForm.data_plantio" class="input text-sm w-36" />
                          </div>
                          <div v-for="(item, index) in editPlantioForm.quantidades" :key="item.especie_id">
                            <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5 whitespace-nowrap">
                              Quantos {{ getEspecieNome(item.especie_id) }} foram plantados? <span class="text-gray-300 dark:text-gray-600">({{ getPlanejada(item.especie_id) }})</span>
                            </label>
                            <input type="number" v-model.number="editPlantioForm.quantidades[index].quantidade" min="0" class="input text-sm w-20 text-center" />
                          </div>
                        </div>
                        <div class="flex justify-end pt-1">
                          <button @click="salvarEdicaoPlantio" class="btn btn-sm btn-primary flex items-center gap-1" :disabled="saving">
                            <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                            <template v-else>
                              <span class="material-icons-outlined text-sm">save</span> Salvar
                            </template>
                          </button>
                        </div>
                      </template>

                      <!-- Edit luz -->
                      <template v-else-if="editingStep === 'germinando' || editingStep === 'luz'">
                        <div class="flex items-end gap-3 flex-wrap">
                          <div>
                            <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Data luz</label>
                            <input type="date" v-model="editLuzForm.data_luz" class="input text-sm w-36" />
                          </div>
                          <div v-for="(item, index) in editLuzForm.valores" :key="item.especie_id">
                            <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5 whitespace-nowrap">
                              Quantos {{ getEspecieNome(item.especie_id) }} germinaram? <span class="text-gray-300 dark:text-gray-600">({{ getPlantada(item.especie_id) }})</span>
                            </label>
                            <div class="flex items-center gap-2">
                              <input type="number" v-model.number="editLuzForm.valores[index].valor" min="0" class="input text-sm w-20 text-center" />
                              <span v-if="getPlantada(item.especie_id) - (item.valor || 0) > 0" class="text-[11px] text-red-500 whitespace-nowrap">
                                -{{ getPlantada(item.especie_id) - (item.valor || 0) }} perda
                              </span>
                              <span v-else class="text-[11px] text-green-600 dark:text-green-400 whitespace-nowrap">sem perda</span>
                            </div>
                          </div>
                        </div>
                        <div class="flex justify-end pt-1">
                          <button @click="salvarEdicaoLuz" class="btn btn-sm btn-primary flex items-center gap-1" :disabled="saving">
                            <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                            <template v-else>
                              <span class="material-icons-outlined text-sm">save</span> Salvar
                            </template>
                          </button>
                        </div>
                      </template>
                    </template>

                    <!-- LOGS do step -->
                    <div v-if="stepLogs.length > 0" class="pt-2 border-t border-border-light/50 dark:border-border-dark/50 space-y-1">
                      <p v-for="log in stepLogs" :key="log.id" class="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                        <span class="material-icons-outlined text-[10px] align-middle">schedule</span>
                        {{ formatLogResumo(log) }}
                      </p>
                    </div>

                  </div>
                </Transition>

                <!-- Delay indicator -->
                <div v-if="atrasoInfo.atrasado" class="mx-6 mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <span class="material-icons-outlined text-red-500 text-lg">warning</span>
                  <span class="text-sm text-red-700 dark:text-red-400 font-medium">
                    Atrasado {{ atrasoInfo.diasAtraso }} dia{{ atrasoInfo.diasAtraso > 1 ? 's' : '' }} na etapa de {{ atrasoInfo.etapaAtrasada }}
                  </span>
                </div>

                <!-- INLINE FORMS (only when no step detail selected) -->
                <div class="px-6 pb-4">

                  <!-- Planejado -->
                  <div v-if="local.status === 'planejado' && !selectedStep" class="flex items-end gap-3 flex-wrap">
                    <div>
                      <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Data plantio</label>
                      <input type="date" v-model="formPlantio.data_plantio" class="input text-sm w-36" />
                    </div>
                    <div v-for="(item, index) in formPlantio.quantidades" :key="item.especie_id">
                      <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5 whitespace-nowrap">
                        Quantos {{ getEspecieNome(item.especie_id) }} foram plantados? <span class="text-gray-300 dark:text-gray-600">({{ getPlanejada(item.especie_id) }})</span>
                      </label>
                      <input type="number" v-model.number="formPlantio.quantidades[index].quantidade" min="0" class="input text-sm w-20 text-center" />
                    </div>
                  </div>

                  <!-- Germinando -->
                  <div v-else-if="local.status === 'germinando' && !selectedStep" class="flex items-end gap-3 flex-wrap">
                    <div>
                      <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Data luz</label>
                      <input type="date" v-model="formLuz.data_luz" class="input text-sm w-36" />
                    </div>
                    <div v-for="(item, index) in formLuzItems" :key="item.especie_id">
                      <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5 whitespace-nowrap">
                        Quantos {{ item.especie_nome }} germinaram? <span class="text-gray-300 dark:text-gray-600">({{ item.quantidade_plantada }})</span>
                      </label>
                      <div class="flex items-center gap-2">
                        <input
                          type="number"
                          v-model.number="formLuzItems[index].valor"
                          min="0"
                          class="input text-sm w-20 text-center"
                        />
                        <span v-if="item.quantidade_plantada - (item.valor || 0) > 0" class="text-[11px] text-red-500 whitespace-nowrap">
                          -{{ item.quantidade_plantada - (item.valor || 0) }} perda
                        </span>
                        <span v-else class="text-[11px] text-green-600 dark:text-green-400 whitespace-nowrap">sem perda</span>
                      </div>
                    </div>
                  </div>

                  <!-- Luz / Colhendo -->
                  <div v-else-if="(local.status === 'luz' || local.status === 'colhendo') && !selectedStep" class="space-y-3">
                    <!-- Histórico de colheitas -->
                    <div v-if="colheitasOrdenadas.length > 0" class="text-xs space-y-1">
                      <span class="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Colheitas registradas</span>
                      <div v-for="colheita in colheitasOrdenadas" :key="colheita.id" class="flex items-center gap-2 py-0.5">
                        <span class="text-subtext-light dark:text-subtext-dark whitespace-nowrap">{{ formatDateTime(colheita.created_at) }}</span>
                        <span v-if="colheita.usuario_email" class="text-gray-400 dark:text-gray-500 truncate max-w-[120px]">{{ colheita.usuario_email }}</span>
                        <span class="font-medium text-text-light dark:text-text-dark">{{ colheita.especies?.nome || '-' }}</span>
                        <span class="font-medium text-text-light dark:text-text-dark ml-auto whitespace-nowrap">{{ colheita.quantidade }} und</span>
                        <button @click="iniciarEdicaoColheita(colheita)" class="text-primary hover:text-primary/80 flex items-center">
                          <span class="material-icons-outlined text-[12px]">edit</span>
                        </button>
                      </div>
                      <!-- Inline edit colheita -->
                      <div v-if="editingColheitaId" class="flex items-end gap-3 flex-wrap pt-1 border-t border-border-light/50 dark:border-border-dark/50">
                        <div>
                          <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Data</label>
                          <input type="date" v-model="editColheitaForm.data_colheita" class="input text-sm w-36" />
                        </div>
                        <div>
                          <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Quantidade</label>
                          <input type="number" v-model.number="editColheitaForm.quantidade" min="0" class="input text-sm w-20 text-center" />
                        </div>
                        <button @click="salvarEdicaoColheita" class="btn btn-sm btn-primary flex items-center gap-1" :disabled="saving">
                          <span class="material-icons-outlined text-sm">save</span> Salvar
                        </button>
                        <button @click="editingColheitaId = null" class="btn btn-sm text-xs">Cancelar</button>
                      </div>
                    </div>
                    <!-- Formulário nova colheita -->
                    <div class="flex items-end gap-3 flex-wrap">
                      <div>
                        <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Data colheita</label>
                        <input type="date" v-model="formColheita.data_colheita" class="input text-sm w-36" />
                      </div>
                      <div v-for="(item, index) in formColheita.colheitas" :key="item.especie_id">
                        <label class="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5 whitespace-nowrap">
                          Quantos {{ getEspecieNome(item.especie_id) }} foram colhidos? <span class="text-gray-300 dark:text-gray-600">({{ getRestanteColheita(item.especie_id) }} rest.)</span>
                        </label>
                        <input type="number" v-model.number="formColheita.colheitas[index].quantidade" min="0" class="input text-sm w-20 text-center" />
                      </div>
                    </div>
                  </div>

                  <!-- Finalizado -->
                  <div v-else-if="local.status === 'finalizado'">
                    <div v-for="pe in local.producao_especies" :key="pe.especie_id" class="flex items-center justify-between text-sm py-2 border-b border-border-light/50 dark:border-border-dark/50 last:border-0">
                      <span class="font-medium text-text-light dark:text-text-dark">{{ pe.especies?.nome || 'Espécie' }}</span>
                      <div class="flex items-center gap-4 text-xs">
                        <span class="text-subtext-light dark:text-subtext-dark">Germ: {{ pe.quantidade_germinada || 0 }}</span>
                        <span class="text-subtext-light dark:text-subtext-dark">Colh: {{ pe.total_colhido || 0 }}</span>
                        <span v-if="calcPerdaFinal(pe) > 0" class="text-red-500 font-medium">Perda: {{ calcPerdaFinal(pe) }}</span>
                        <span v-else class="text-green-600 dark:text-green-400 font-medium">Sem perdas</span>
                      </div>
                    </div>
                  </div>

                  <!-- Cancelado -->
                  <div v-else-if="local.status === 'cancelado'" class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <span class="material-icons-outlined text-base">cancel</span>
                    <span>Produção cancelada<template v-if="local.data_cancelado"> em {{ formatDate(local.data_cancelado) }}</template></span>
                  </div>

                </div>
              </div>

              <!-- FOOTER -->
              <div
                v-if="!['finalizado', 'cancelado'].includes(local.status)"
                class="flex items-center justify-between px-6 py-3 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex-shrink-0"
              >
                <button
                  @click="handleCancelar"
                  class="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Cancelar Produção
                </button>

                <div v-if="!selectedStep" class="flex items-center gap-3">
                  <button
                    v-if="local.status === 'colhendo'"
                    @click="handleFinalizar"
                    class="px-3 py-1.5 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    :disabled="saving"
                  >
                    <span class="material-icons-outlined text-sm">check_circle</span>
                    Finalizar Produção
                  </button>
                  <button
                    @click="handleAction"
                    class="btn btn-primary btn-sm flex items-center gap-1.5"
                    :disabled="saving"
                  >
                    <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                    <template v-else>
                      {{ actionLabel }}
                      <span class="material-icons-outlined text-sm">arrow_forward</span>
                    </template>
                  </button>
                </div>
              </div>

            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ProducaoCompleta, ProducaoStatus, ProducaoLog, RegistroPlantioForm, RegistroLuzForm, RegistroColheitaForm } from '~/composables/types/producao'
import { PRODUCAO_STATUS_CONFIG } from '~/composables/types/producao'

const props = defineProps({
  show: { type: Boolean, default: true },
  producao: { type: Object as () => ProducaoCompleta, required: true }
})

const emit = defineEmits(['close', 'atualizado'])

const supabase = useSupabaseClient()
const producaoService = useProducao()
const calc = useProducaoCalc()
const toast = useToast()

const local = ref<ProducaoCompleta>({ ...props.producao })

watch(() => props.producao, (val) => {
  local.value = { ...val }
  if (props.show) initForms()
}, { deep: true })

// ============================================================
// State
// ============================================================

const saving = ref(false)
const selectedStep = ref<string | null>(null)
const editingStep = ref<string | null>(null)
const logs = ref<ProducaoLog[]>([])

function handleStepClick(step: any) {
  if (step.completed) {
    if (selectedStep.value === step.key) {
      selectedStep.value = null
      editingStep.value = null
    } else {
      selectedStep.value = step.key
      editingStep.value = null
    }
  } else if (step.current) {
    selectedStep.value = null
    editingStep.value = null
  }
}

// ============================================================
// Forms (must be declared before watchers that use initForms)
// ============================================================

const formPlantio = ref<RegistroPlantioForm>({
  data_plantio: new Date().toISOString().split('T')[0],
  quantidades: []
})

const formLuz = ref({ data_luz: new Date().toISOString().split('T')[0] })

interface FormLuzItem {
  especie_id: string
  especie_nome: string
  quantidade_plantada: number
  valor: number
}

const formLuzItems = ref<FormLuzItem[]>([])

const formColheita = ref<RegistroColheitaForm>({
  data_colheita: new Date().toISOString().split('T')[0],
  colheitas: [],
  observacoes: ''
})

function initForms() {
  const today = new Date().toISOString().split('T')[0]
  const especies = local.value.producao_especies || []

  formPlantio.value = {
    data_plantio: today,
    quantidades: especies.map(pe => ({
      especie_id: pe.especie_id,
      quantidade: pe.quantidade_planejada || 0
    }))
  }

  formLuz.value.data_luz = today
  formLuzItems.value = especies.map(pe => ({
    especie_id: pe.especie_id,
    especie_nome: pe.especies?.nome || 'Espécie',
    quantidade_plantada: pe.quantidade_plantada || 0,
    valor: pe.quantidade_plantada || 0
  }))

  formColheita.value = {
    data_colheita: today,
    colheitas: especies.map(pe => ({
      especie_id: pe.especie_id,
      quantidade: 0
    })),
    observacoes: ''
  }

  selectedStep.value = null
  editingStep.value = null
}

// ============================================================
// Logs
// ============================================================

async function loadLogs() {
  logs.value = await producaoService.carregarLogs(local.value.id)
}

async function reloadLocal() {
  const fresh = await producaoService.buscarProducao(local.value.id)
  if (fresh) {
    local.value = fresh
    initForms()
  }
  await loadLogs()
}

watch(() => props.show, async (val) => {
  if (val) {
    initForms()
    await loadLogs()
  }
}, { immediate: true })

watch(() => local.value.status, () => {
  initForms()
})

const stepLogs = computed(() => {
  if (!selectedStep.value) return []
  const actionMap: Record<string, string[]> = {
    'planejado': ['criacao', 'plantio', 'edicao_plantio'],
    'germinando': ['luz', 'edicao_luz'],
    'luz': ['edicao_luz'],
    'colhendo': ['colheita', 'edicao_colheita'],
    'finalizado': ['finalizado'],
  }
  const actions = actionMap[selectedStep.value] || []
  return logs.value.filter(l => actions.includes(l.acao))
})

function formatLogChanges(log: ProducaoLog): Array<{ antes: string; depois: string }> {
  const changes: Array<{ antes: string; depois: string }> = []
  const { antes, depois } = log.dados

  if (!antes || !depois) return changes

  // Data changes
  if (antes.data_plantio !== depois.data_plantio) {
    changes.push({ antes: `Data: ${formatDate(antes.data_plantio)}`, depois: `Data: ${formatDate(depois.data_plantio)}` })
  }
  if (antes.data_luz !== depois.data_luz) {
    changes.push({ antes: `Data: ${formatDate(antes.data_luz)}`, depois: `Data: ${formatDate(depois.data_luz)}` })
  }

  // Quantidades (plantio edit)
  if (antes.quantidades && depois.quantidades) {
    for (const dep of depois.quantidades) {
      const ant = antes.quantidades.find((a: any) => a.especie_id === dep.especie_id)
      if (ant && ant.quantidade !== dep.quantidade) {
        const nome = dep.nome || ant.nome || 'Espécie'
        changes.push({ antes: `${nome}: ${ant.quantidade}`, depois: `${nome}: ${dep.quantidade}` })
      }
    }
  }

  // Valores (luz edit)
  if (antes.valores && depois.valores) {
    for (const dep of depois.valores) {
      const ant = antes.valores.find((a: any) => a.especie_id === dep.especie_id)
      if (ant && ant.germinada !== dep.germinada) {
        const nome = dep.nome || ant.nome || 'Espécie'
        changes.push({ antes: `${nome}: ${ant.germinada} germ.`, depois: `${nome}: ${dep.germinada} germ.` })
      }
    }
  }

  // Colheita edit (chaves dinâmicas: data_colheita + nome da especie)
  if (antes.data_colheita !== undefined || depois.data_colheita !== undefined) {
    if (antes.data_colheita !== depois.data_colheita) {
      changes.push({ antes: `Data: ${formatDate(antes.data_colheita)}`, depois: `Data: ${formatDate(depois.data_colheita)}` })
    }
    for (const key of Object.keys(depois)) {
      if (key === 'data_colheita') continue
      if (antes[key] !== depois[key]) {
        changes.push({ antes: `${key}: ${antes[key]}`, depois: `${key}: ${depois[key]}` })
      }
    }
  }

  return changes
}

function formatLogDados(log: ProducaoLog): string[] {
  const lines: string[] = []
  const d = log.dados
  if (!d || d.antes || d.depois) return lines // edições usam outro formato

  if (d.data_plantio) lines.push(`Data: ${formatDate(d.data_plantio)}`)
  if (d.data_luz) lines.push(`Data: ${formatDate(d.data_luz)}`)
  if (d.data_colheita) lines.push(`Data: ${formatDate(d.data_colheita)}`)

  if (d.quantidades) {
    for (const q of d.quantidades) {
      lines.push(`${getEspecieNome(q.especie_id)}: ${q.quantidade} plantadas`)
    }
  }
  if (d.valores) {
    for (const v of d.valores) {
      lines.push(`${getEspecieNome(v.especie_id)}: ${v.valor} ${v.isPerda ? 'perdidas' : 'germinadas'}`)
    }
  }
  if (d.colheitas) {
    for (const c of d.colheitas) {
      lines.push(`${getEspecieNome(c.especie_id)}: ${c.quantidade} colhidas`)
    }
  }
  if (d.quantidade_planejada) {
    lines.push(`Qtd planejada: ${d.quantidade_planejada}`)
  }

  return lines
}

function formatLogResumo(log: ProducaoLog): string {
  const parts: string[] = []
  parts.push(formatDateTime(log.created_at))
  parts.push(log.usuario_email)
  parts.push('·')
  parts.push(logAcaoLabel(log.acao))

  const d = log.dados
  if (!d) return parts.join(' ')

  // Edições (antes/depois)
  if (d.antes && d.depois) {
    const changes = formatLogChanges(log)
    if (changes.length > 0) {
      parts.push('—')
      parts.push(changes.map(c => `${c.antes} → ${c.depois}`).join(', '))
    }
    return parts.join(' ')
  }

  // Ações normais
  const detalhes: string[] = []
  if (d.data_plantio) detalhes.push(`Data: ${formatDate(d.data_plantio)}`)
  if (d.data_luz) detalhes.push(`Data: ${formatDate(d.data_luz)}`)
  if (d.data_colheita) detalhes.push(`Data: ${formatDate(d.data_colheita)}`)
  if (d.quantidades) {
    for (const q of d.quantidades) detalhes.push(`${getEspecieNome(q.especie_id)}: ${q.quantidade} plantadas`)
  }
  if (d.valores) {
    for (const v of d.valores) detalhes.push(`${getEspecieNome(v.especie_id)}: ${v.valor} ${v.isPerda ? 'perdidas' : 'germinadas'}`)
  }
  if (d.colheitas) {
    for (const c of d.colheitas) detalhes.push(`${getEspecieNome(c.especie_id)}: ${c.quantidade} colhidas`)
  }
  if (d.quantidade_planejada) detalhes.push(`Qtd: ${d.quantidade_planejada}`)

  if (detalhes.length > 0) {
    parts.push('—')
    parts.push(detalhes.join(', '))
  }

  return parts.join(' ')
}

function logAcaoLabel(acao: string): string {
  const map: Record<string, string> = {
    'criacao': 'Criou produção',
    'plantio': 'Registrou plantio',
    'luz': 'Registrou luz',
    'colheita': 'Registrou colheita',
    'finalizado': 'Finalizou',
    'cancelado': 'Cancelou',
    'edicao_plantio': 'Editou plantio',
    'edicao_luz': 'Editou germinação',
    'edicao_colheita': 'Editou colheita',
  }
  return map[acao] || acao
}

// ============================================================
// Editing
// ============================================================

const canEditSelectedStep = computed(() => {
  if (!selectedStep.value) return false
  if (local.value.status === 'cancelado') return false
  return ['planejado', 'germinando', 'luz'].includes(selectedStep.value)
})

interface EditLuzItem { especie_id: string; valor: number }

const editPlantioForm = ref<{ data_plantio: string; quantidades: Array<{ especie_id: string; quantidade: number }> }>({
  data_plantio: '',
  quantidades: []
})

const editLuzForm = ref<{ data_luz: string; valores: EditLuzItem[] }>({
  data_luz: '',
  valores: []
})

function toggleEditStep() {
  if (editingStep.value) {
    editingStep.value = null
    return
  }

  if (selectedStep.value === 'planejado') {
    editPlantioForm.value = {
      data_plantio: local.value.data_plantio_real || '',
      quantidades: (local.value.producao_especies || []).map(pe => ({
        especie_id: pe.especie_id,
        quantidade: pe.quantidade_plantada || 0
      }))
    }
  } else if (selectedStep.value === 'germinando' || selectedStep.value === 'luz') {
    editLuzForm.value = {
      data_luz: local.value.data_luz_real || '',
      valores: (local.value.producao_especies || []).map(pe => ({
        especie_id: pe.especie_id,
        valor: pe.quantidade_germinada || 0
      }))
    }
  }

  editingStep.value = selectedStep.value
}

function validarEditPlantio(): boolean {
  for (const item of editPlantioForm.value.quantidades) {
    const max = getPlanejada(item.especie_id)
    const nome = getEspecieNome(item.especie_id)
    if (item.quantidade < 0) {
      toast.error(`${nome}: quantidade não pode ser negativa`)
      return false
    }
    if (item.quantidade > max) {
      toast.error(`${nome}: ${item.quantidade} plantadas excede o máximo de ${max} planejadas`)
      return false
    }
  }
  return true
}

function validarEditLuz(): boolean {
  for (const item of editLuzForm.value.valores) {
    const max = getPlantada(item.especie_id)
    const nome = getEspecieNome(item.especie_id)
    if (item.valor < 0) {
      toast.error(`${nome}: quantidade não pode ser negativa`)
      return false
    }
    if (item.valor > max) {
      toast.error(`${nome}: ${item.valor} germinadas excede o máximo de ${max} plantadas`)
      return false
    }
  }
  return true
}

async function salvarEdicaoPlantio() {
  if (saving.value) return
  if (!validarEditPlantio()) return
  saving.value = true
  try {
    const ok = await producaoService.editarDadosPlantio(local.value.id, editPlantioForm.value)
    if (ok) {
      editingStep.value = null
      await reloadLocal()
      emit('atualizado')
    }
  } finally {
    saving.value = false
  }
}

async function salvarEdicaoLuz() {
  if (saving.value) return
  if (!validarEditLuz()) return
  saving.value = true
  try {
    const payload: RegistroLuzForm = {
      data_luz: editLuzForm.value.data_luz,
      valores: editLuzForm.value.valores.map(v => ({
        especie_id: v.especie_id,
        valor: v.valor,
        isPerda: false
      }))
    }
    const ok = await producaoService.editarDadosLuz(local.value.id, payload)
    if (ok) {
      editingStep.value = null
      await reloadLocal()
      emit('atualizado')
    }
  } finally {
    saving.value = false
  }
}

// ============================================================
// Edição de colheita
// ============================================================

const editingColheitaId = ref<string | null>(null)
const editColheitaForm = ref<{ data_colheita: string; quantidade: number }>({ data_colheita: '', quantidade: 0 })

function iniciarEdicaoColheita(colheita: any) {
  editingColheitaId.value = colheita.id
  editColheitaForm.value = {
    data_colheita: colheita.data_colheita || '',
    quantidade: colheita.quantidade || 0
  }
}

async function salvarEdicaoColheita() {
  if (saving.value || !editingColheitaId.value) return
  saving.value = true
  try {
    // Buscar dados anteriores
    const colheitaAnterior = (local.value.producao_colheitas || []).find((c: any) => c.id === editingColheitaId.value)
    const especieNome = colheitaAnterior?.especies?.nome || 'Espécie'

    const { error } = await supabase
      .from('producao_colheitas')
      .update({
        data_colheita: editColheitaForm.value.data_colheita,
        quantidade: editColheitaForm.value.quantidade
      })
      .eq('id', editingColheitaId.value)

    if (error) throw error

    // Atualizar total_colhido na producao_especies
    const especieId = colheitaAnterior?.especie_id
    if (especieId) {
      const { data: colheitas } = await supabase
        .from('producao_colheitas')
        .select('quantidade')
        .eq('producao_id', local.value.id)
        .eq('especie_id', especieId)
      const total = (colheitas || []).reduce((sum: number, c: any) => sum + (c.quantidade || 0), 0)
      await supabase
        .from('producao_especies')
        .update({ total_colhido: total })
        .eq('producao_id', local.value.id)
        .eq('especie_id', especieId)
    }

    // Log
    producaoService.criarLog(local.value.id, 'edicao_colheita', {
      antes: { data_colheita: colheitaAnterior?.data_colheita, [`${especieNome}`]: colheitaAnterior?.quantidade },
      depois: { data_colheita: editColheitaForm.value.data_colheita, [`${especieNome}`]: editColheitaForm.value.quantidade }
    })

    editingColheitaId.value = null
    await reloadLocal()
    emit('atualizado')
    toast.success('Colheita atualizada')
  } catch (e: any) {
    console.error('Erro ao editar colheita:', e)
    toast.error(e.message || 'Erro ao editar colheita')
  } finally {
    saving.value = false
  }
}

// ============================================================
// Computed
// ============================================================

const codigoProducao = computed(() => {
  return local.value.codigo || local.value.id.substring(0, 6).toUpperCase()
})

const pipelineSteps = computed(() => {
  const s = local.value.status
  const isCancelado = s === 'cancelado'
  const statusOrder: ProducaoStatus[] = ['planejado', 'germinando', 'luz', 'colhendo', 'finalizado']
  const currentIndex = statusOrder.indexOf(s)

  const colheitas = local.value.producao_colheitas || []
  const ultimaColheita = colheitas.length > 0
    ? [...colheitas].sort((a, b) => (b.data_colheita || '').localeCompare(a.data_colheita || ''))[0]?.data_colheita
    : null

  return [
    { key: 'planejado', label: 'Planejado', icon: 'event_note', date: local.value.data_planejado || local.value.data_plantio_prevista, completed: currentIndex > 0 || s === 'finalizado', current: s === 'planejado', cancelled: isCancelado && currentIndex < 0 },
    { key: 'germinando', label: 'Germinando', icon: 'grass', date: local.value.data_plantio_real, completed: currentIndex > 1 || s === 'finalizado', current: s === 'germinando', cancelled: isCancelado && !local.value.data_plantio_real },
    { key: 'luz', label: 'Luz', icon: 'wb_sunny', date: local.value.data_luz_real, completed: currentIndex > 2 || s === 'finalizado', current: s === 'luz', cancelled: isCancelado && !local.value.data_luz_real },
    { key: 'colhendo', label: 'Colhendo', icon: 'content_cut', date: ultimaColheita, completed: s === 'finalizado', current: s === 'colhendo', cancelled: isCancelado && !ultimaColheita },
    { key: 'finalizado', label: 'Finalizado', icon: 'check_circle', date: local.value.data_finalizado, completed: s === 'finalizado', current: false, cancelled: isCancelado }
  ]
})

const atrasoInfo = computed(() => {
  return calc.calcularAtraso(
    local.value.status,
    { data_plantio_real: local.value.data_plantio_real, data_luz_real: local.value.data_luz_real },
    {
      data_plantio_prevista: local.value.data_plantio_prevista,
      data_luz_prevista: local.value.data_luz_prevista,
      data_colheita_prevista: local.value.data_colheita_prevista
    }
  )
})

const colheitasOrdenadas = computed(() => {
  const colheitas = local.value.producao_colheitas || []
  return [...colheitas].sort((a, b) => (b.data_colheita || '').localeCompare(a.data_colheita || ''))
})

const actionLabel = computed(() => {
  switch (local.value.status) {
    case 'planejado': return 'Registrar Plantio'
    case 'germinando': return 'Registrar Luz'
    case 'luz':
    case 'colhendo': return 'Registrar Colheita'
    default: return ''
  }
})

// ============================================================
// Helpers
// ============================================================

function getEspecieNome(especieId: string): string {
  const pe = local.value.producao_especies?.find(e => e.especie_id === especieId)
  return pe?.especies?.nome || 'Espécie'
}

function getPlanejada(especieId: string): number {
  const pe = local.value.producao_especies?.find(e => e.especie_id === especieId)
  return pe?.quantidade_planejada || 0
}

function getPlantada(especieId: string): number {
  const pe = local.value.producao_especies?.find(e => e.especie_id === especieId)
  return pe?.quantidade_plantada || 0
}

function getGerminada(especieId: string): number {
  const pe = local.value.producao_especies?.find(e => e.especie_id === especieId)
  return pe?.quantidade_germinada || 0
}

function getColhido(especieId: string): number {
  const pe = local.value.producao_especies?.find(e => e.especie_id === especieId)
  return pe?.total_colhido || 0
}

// ============================================================
// Validação de divergência (bloqueia ação + toast)
// ============================================================

function validarPlantio(): boolean {
  for (const item of formPlantio.value.quantidades) {
    const max = getPlanejada(item.especie_id)
    const nome = getEspecieNome(item.especie_id)
    if (item.quantidade < 0) {
      toast.error(`${nome}: quantidade não pode ser negativa`)
      return false
    }
    if (item.quantidade > max) {
      toast.error(`${nome}: ${item.quantidade} plantadas excede o máximo de ${max} planejadas`)
      return false
    }
  }
  return true
}

function validarLuz(): boolean {
  for (const item of formLuzItems.value) {
    const max = item.quantidade_plantada
    if (item.valor < 0) {
      toast.error(`${item.especie_nome}: quantidade não pode ser negativa`)
      return false
    }
    if (item.valor > max) {
      toast.error(`${item.especie_nome}: ${item.valor} germinadas excede o máximo de ${max} plantadas`)
      return false
    }
  }
  return true
}

function validarColheita(): boolean {
  for (const item of formColheita.value.colheitas) {
    const max = getRestanteColheita(item.especie_id)
    const nome = getEspecieNome(item.especie_id)
    if (item.quantidade < 0) {
      toast.error(`${nome}: quantidade não pode ser negativa`)
      return false
    }
    if (item.quantidade > max) {
      toast.error(`${nome}: ${item.quantidade} colhidas excede o restante de ${max}`)
      return false
    }
  }
  return true
}

function getRestanteColheita(especieId: string): number {
  return Math.max(0, getGerminada(especieId) - getColhido(especieId))
}

function calcPerdaFinal(pe: any): number {
  return calc.calcularPerdaFinal(pe.quantidade_germinada || 0, pe.total_colhido || 0)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month} ${hours}:${mins}`
}

function statusBadgeClass(status: ProducaoStatus): string {
  const map: Record<ProducaoStatus, string> = {
    planejado: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:border-blue-500 dark:text-blue-400',
    germinando: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:border-amber-400 dark:text-amber-400',
    luz: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400',
    colhendo: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:border-orange-400 dark:text-orange-400',
    finalizado: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:border-green-500 dark:text-green-400',
    cancelado: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:border-red-400 dark:text-red-400',
  }
  return map[status] || map.planejado
}

// ============================================================
// Save actions
// ============================================================

function handleAction() {
  switch (local.value.status) {
    case 'planejado': return salvarPlantio()
    case 'germinando': return salvarLuz()
    case 'luz':
    case 'colhendo': return salvarColheita()
  }
}

async function salvarPlantio() {
  if (saving.value) return
  if (!validarPlantio()) return
  saving.value = true
  try {
    const ok = await producaoService.registrarPlantio(local.value.id, formPlantio.value)
    if (ok) {
      emit('atualizado')
      emit('close')
    }
  } finally {
    saving.value = false
  }
}

async function salvarLuz() {
  if (saving.value) return
  if (!validarLuz()) return
  saving.value = true
  try {
    const payload: RegistroLuzForm = {
      data_luz: formLuz.value.data_luz,
      valores: formLuzItems.value.map(item => ({
        especie_id: item.especie_id,
        valor: item.valor || 0,
        isPerda: false
      }))
    }
    const ok = await producaoService.registrarLuz(local.value.id, payload)
    if (ok) {
      emit('atualizado')
      emit('close')
    }
  } finally {
    saving.value = false
  }
}

async function salvarColheita() {
  if (saving.value) return
  if (!validarColheita()) return
  saving.value = true
  try {
    const ok = await producaoService.registrarColheita(local.value.id, formColheita.value)
    if (ok) {
      emit('atualizado')
      emit('close')
    }
  } finally {
    saving.value = false
  }
}

async function handleFinalizar() {
  const confirmou = confirm('Finalizar esta produção? Esta ação não pode ser desfeita.')
  if (!confirmou) return
  if (saving.value) return
  saving.value = true
  try {
    const ok = await producaoService.finalizarProducao(local.value.id)
    if (ok) {
      emit('atualizado')
      emit('close')
    }
  } finally {
    saving.value = false
  }
}

async function handleCancelar() {
  const confirmou = confirm('Tem certeza que deseja cancelar esta produção?')
  if (!confirmou) return
  const ok = await producaoService.cancelarProducao(local.value.id)
  if (ok) {
    emit('atualizado')
    emit('close')
  }
}
</script>
