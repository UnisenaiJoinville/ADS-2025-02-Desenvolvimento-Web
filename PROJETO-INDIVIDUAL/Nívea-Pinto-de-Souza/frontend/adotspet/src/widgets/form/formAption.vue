<template>
  <div class="flex flex-col gap-4">
    <div class="bg-white rounded-card shadow-suave overflow-hidden">
      <div class="px-7 pt-6 pb-4 border-b border-gray-100">
        <h2 class="font-bold text-texto text-base">Formulário De Adoção</h2>
      </div>
      <div class="px-7 py-5 flex items-center">
        <template v-for="(passo, i) in passos" :key="passo.numero">
          <!-- Círculo + label -->
          <div class="flex items-center gap-2 shrink-0">
            <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0',
                          etapa > passo.numero  ? 'bg-green-500 text-white' :
                          etapa === passo.numero ? 'bg-roxo text-white' :
                                                   'border-2 border-gray-300 text-subtexto']">
              <i v-if="etapa > passo.numero" class="bi bi-check-lg text-xs"></i>
              <span v-else>{{ passo.numero }}</span>
            </div>
            <span :class="['text-xs font-semibold hidden sm:block',
                           etapa > passo.numero  ? 'text-green-500' :
                           etapa === passo.numero ? 'text-roxo' :
                                                    'text-subtexto']">
              {{ passo.label }}
            </span>
          </div>
          <div v-if="i < passos.length - 1"
               :class="['flex-1 border-t-2 border-dashed mx-3',
                        etapa > passo.numero ? 'border-green-400' : 'border-gray-200']">
          </div>
        </template>
      </div>

      <div class="px-7 pb-2">
        <Transition name="slide-etapa" mode="out-in">

          <div v-if="etapa === 1" key="1">
            <h3 class="text-texto font-bold text-base mb-0.5">Dados pessoais</h3>
            <p class="text-subtexto text-xs mb-5">Preencha suas informações para seguirmos com a adoção.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InputBase v-model="form.nome"      rotulo="Nome" />
              <InputBase v-model="form.sobrenome" rotulo="Sobrenome" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InputBase v-model="form.dataNascimento" rotulo="Data de Nascimento" tipo="date" />
              <div class="w-full">
                <label class="block text-sm font-semibold text-subtexto mb-1.5">Estado Civil</label>
                <select v-model="form.estadoCivil" class="campo-select">
                  <option value="">Selecione...</option>
                  <option>Solteiro(a)</option>
                  <option>Casado(a)</option>
                  <option>Divorciado(a)</option>
                  <option>Viúvo(a)</option>
                  <option>União estável</option>
                </select>
              </div>
            </div>
            <InputBase v-model="form.cpf" rotulo="CPF" placeholder="000.000.000-00" class="mb-4 max-w-xs" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <InputBase v-model="form.email"    rotulo="Email" tipo="email" />
              <InputBase v-model="form.whatsapp" rotulo="Número Whatsapp" placeholder="(47) 99999-9999" />
            </div>

            <div class="w-full">
              <label class="block text-sm font-semibold text-subtexto mb-1.5">Documento com foto</label>
              <div
                class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
                :class="dragAtivo ? 'border-roxo bg-roxo-claro' : 'border-gray-200 hover:border-roxo/50'"
                @dragover.prevent="dragAtivo = true"
                @dragleave="dragAtivo = false"
                @drop.prevent="aoSoltarArquivo"
                @click="$refs.inputArquivo.click()"
              >
                <i class="bi bi-file-earmark-text text-4xl text-subtexto block mb-2"></i>
                <p v-if="!form.documento" class="text-texto text-sm font-medium">Arraste e solte seus arquivos aqui</p>
                <p v-else class="text-roxo text-sm font-semibold">{{ form.documento }}</p>
                <p class="text-subtexto text-xs mt-1">Formatos aceitos: JPEG, PNG, PDF e MP4, com até 50MB</p>
                <button type="button" class="mt-3 border border-gray-300 rounded-full px-4 py-1.5 text-xs text-texto hover:border-roxo hover:text-roxo transition-colors">
                  Escolher Arquivo
                </button>
              </div>
              <input ref="inputArquivo" type="file" accept=".jpg,.jpeg,.png,.pdf,.mp4" class="hidden" @change="aoEscolherArquivo" />
            </div>
          </div>

          <div v-else-if="etapa === 2" key="2">
            <h3 class="text-texto font-bold text-base mb-0.5">Endereço</h3>
            <p class="text-subtexto text-xs mb-5">Informe seu endereço para continuarmos o processo de adoção.</p>

            <div class="max-w-xs mb-4">
              <label class="block text-sm font-semibold text-subtexto mb-1.5">CEP</label>
              <div class="relative">
                <input
                  v-model="form.cep"
                  placeholder="000.000-00"
                  maxlength="9"
                  class="campo-input pr-10"
                  @input="onCepInput"
                />
                <i v-if="buscandoCep" class="bi bi-arrow-repeat animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-subtexto text-sm"></i>
                <i v-else-if="form.rua" class="bi bi-check-circle-fill absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm"></i>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <InputBase v-model="form.numero" rotulo="Número" class="col-span-1" />
              <InputBase v-model="form.rua"    rotulo="Rua"    class="col-span-1 md:col-span-4" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <InputBase v-model="form.bairro" rotulo="Bairro" />
              <InputBase v-model="form.cidade" rotulo="Cidade" />
              <InputBase v-model="form.estado" rotulo="Estado" />
            </div>
            <InputBase v-model="form.complemento" rotulo="Complemento" placeholder="Casa de esquina" class="mb-6" />

            <h4 class="text-texto font-bold text-sm mb-4">Informações da Moradia</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <p class="campo-rotulo">Você mora em</p>
                <div class="flex flex-wrap gap-4">
                  <label v-for="op in ['Casa','Apartamento','Sítio/Chácara']" :key="op" class="radio-label">
                    <input type="radio" v-model="form.tipoMoradia" :value="op" class="accent-[#4E59BF]" />
                    {{ op }}
                  </label>
                </div>
              </div>
              <div>
                <p class="campo-rotulo">O imóvel é</p>
                <div class="flex flex-wrap gap-4">
                  <label v-for="op in ['Próprio','Alugado','Casa de familiar']" :key="op" class="radio-label">
                    <input type="radio" v-model="form.tipoImovel" :value="op" class="accent-[#4E59BF]" />
                    {{ op }}
                  </label>
                </div>
              </div>
            </div>

            <div v-if="form.tipoImovel === 'Alugado'" class="mb-4">
              <p class="campo-rotulo">Se for alugado, o contrato permite animais?</p>
              <div class="flex gap-4">
                <label v-for="op in ['Sim','Não','Não sei']" :key="op" class="radio-label">
                  <input type="radio" v-model="form.contratoPermiteAnimais" :value="op" class="accent-[#4E59BF]" />
                  {{ op }}
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <p class="campo-rotulo">Possui quintal?</p>
                <div class="flex gap-4">
                  <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                    <input type="radio" v-model="form.possuiQuintal" :value="op" class="accent-[#4E59BF]" />
                    {{ op }}
                  </label>
                </div>
              </div>
              <div v-if="form.possuiQuintal === 'Sim'">
                <p class="campo-rotulo">O quintal é totalmente fechado?</p>
                <div class="flex gap-4">
                  <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                    <input type="radio" v-model="form.quintalFechado" :value="op" class="accent-[#4E59BF]" />
                    {{ op }}
                  </label>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <p class="campo-rotulo">Alguém tem alergia a animais?</p>
                <div class="flex gap-4">
                  <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                    <input type="radio" v-model="form.alguemAlergia" :value="op" class="accent-[#4E59BF]" />
                    {{ op }}
                  </label>
                </div>
              </div>
              <div>
                <p class="campo-rotulo">Quantas pessoas moram na residência?</p>
                <input type="number" v-model.number="form.pessoasResidencia" min="1" class="campo-input w-24" />
              </div>
            </div>
          </div>

          <div v-else-if="etapa === 3" key="3">
            <h3 class="text-texto font-bold text-base mb-0.5">Detalhes sobre o ambiente</h3>
            <p class="text-subtexto text-xs mb-5">Preencha informações sobre o espaço onde o pet irá viver para seguirmos com a adoção.</p>

            <div class="mb-4">
              <p class="campo-rotulo">Possui outros animais?</p>
              <div class="flex gap-4">
                <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                  <input type="radio" v-model="form.possuiOutrosAnimais" :value="op" class="accent-[#4E59BF]" />
                  {{ op }}
                </label>
              </div>
            </div>

            <div v-if="form.possuiOutrosAnimais === 'Sim'" class="mb-4">
              <p class="campo-rotulo">Quantos?</p>
              <input type="number" v-model.number="form.quantosAnimais" min="1" class="campo-input w-24 mb-4" />

              <div class="w-full mb-4">
                <label class="block text-sm font-semibold text-subtexto mb-1.5">Descreva as espécies desses animais</label>
                <textarea v-model="form.especiesAnimais" rows="3" class="campo-textarea"></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <div>
                  <p class="campo-rotulo">São Castrados</p>
                  <div class="flex gap-4">
                    <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                      <input type="radio" v-model="form.saoCastrados" :value="op" class="accent-[#4E59BF]" />
                      {{ op }}
                    </label>
                  </div>
                </div>
                <div>
                  <p class="campo-rotulo">São Vacinados</p>
                  <div class="flex gap-4">
                    <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                      <input type="radio" v-model="form.saoVacinados" :value="op" class="accent-[#4E59BF]" />
                      {{ op }}
                    </label>
                  </div>
                </div>
              </div>

              <div class="w-full mb-4">
                <label class="block text-sm font-semibold text-subtexto mb-1.5">Observação</label>
                <textarea v-model="form.observacaoAnimais" rows="2" class="campo-textarea"></textarea>
              </div>
            </div>

            <h4 class="text-texto font-bold text-sm mb-4">Sobre Outros Animais</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <p class="campo-rotulo">Já devolveu algum animal adotado?</p>
                <div class="flex gap-4">
                  <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                    <input type="radio" v-model="form.devolveuAnimal" :value="op" class="accent-[#4E59BF]" />
                    {{ op }}
                  </label>
                </div>
              </div>
              <div>
                <p class="campo-rotulo">O animal ficará sozinho por quantas horas por dia?</p>
                <input type="number" v-model.number="form.horasSozinho" min="0" max="24" class="campo-input w-24" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <p class="campo-rotulo">Está ciente dos custos com:</p>
                <div class="flex flex-col gap-2">
                  <label v-for="custo in opcoesCustos" :key="custo.campo" class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="form.custos[custo.campo]" class="accent-[#4E59BF] w-4 h-4" />
                    <span class="text-sm text-texto">{{ custo.label }}</span>
                  </label>
                </div>
              </div>
              <div>
                <p class="campo-rotulo">Renda mensal aproximada:</p>
                <div class="flex flex-col gap-2">
                  <label v-for="op in opcoesRenda" :key="op" class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="form.rendaMensal" :value="op" class="accent-[#4E59BF]" />
                    <span class="text-sm text-texto">{{ op }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-semibold text-subtexto mb-1.5">Por que desejo adotar este animal?</label>
              <textarea v-model="form.motivoAdocao" rows="3" class="campo-textarea"></textarea>
            </div>

            <div class="mb-4">
              <p class="campo-rotulo">Está disposto(a) a permitir visitas de acompanhamento?</p>
              <div class="flex gap-4">
                <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                  <input type="radio" v-model="form.permiteVisitas" :value="op" class="accent-[#4E59BF]" />
                  {{ op }}
                </label>
              </div>
            </div>

            <div class="mb-5">
              <p class="campo-rotulo">Concorda em assinar termo de responsabilidade?</p>
              <div class="flex gap-4">
                <label v-for="op in ['Sim','Não']" :key="op" class="radio-label">
                  <input type="radio" v-model="form.concordaTermos" :value="op" class="accent-[#4E59BF]" />
                  {{ op }}
                </label>
              </div>
            </div>

            <label class="flex items-start gap-3 cursor-pointer mb-2">
              <input type="checkbox" v-model="form.declaraVeracidade" class="accent-[#4E59BF] w-4 h-4 mt-0.5 shrink-0" />
              <span class="text-xs text-subtexto leading-relaxed">
                Declaro que as informações são verdadeiras e estou ciente que a ONG poderá reprovar a
                solicitação caso identifique inconsistências
              </span>
            </label>
          </div>

          <div v-else key="4" class="py-8 text-center">
            <h3 class="text-roxo font-bold text-2xl mb-4">Parabéns</h3>
            <i class="bi bi-hand-heart text-5xl text-laranja mb-5 block"></i>
            <div class="bg-green-600 rounded-xl px-6 py-4 mb-5 max-w-sm mx-auto">
              <p class="text-white text-sm leading-relaxed">
                Nossa equipe irá analisar cuidadosamente as informações enviadas para garantir
                que o animalzinho tenha um lar seguro e cheio de amor
              </p>
            </div>
            <p class="text-subtexto text-xs leading-relaxed max-w-xs mx-auto">
              Assim que o processo for concluído, você será notificado(a) sobre a aprovação
              e os próximos passos do processo
            </p>
          </div>

        </Transition>
      </div>

      <div class="px-7 py-4 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-subtexto">
          {{ etapa <= 3 ? `Etapa ${etapa} de 3` : '' }}
        </span>
        <div class="flex gap-3">
          <template v-if="etapa === 4">
            <button @click="etapa = 1"
                    class="border-2 border-gray-300 text-texto text-sm font-semibold px-5 py-2 rounded-full hover:border-roxo hover:text-roxo transition-colors">
              Editar
            </button>
            <button @click="concluir"
                    class="bg-roxo text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-roxo-hover transition-colors">
              Concluir
            </button>
          </template>

          <!-- Navegação normal -->
          <template v-else>
            <button v-if="etapa > 1" @click="etapa--"
                    class="border-2 border-gray-300 text-texto text-sm font-semibold px-5 py-2 rounded-full hover:border-roxo hover:text-roxo transition-colors">
              Anterior
            </button>
            <button v-if="etapa < 3" @click="proximaEtapa"
                    class="bg-roxo text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-roxo-hover transition-colors">
              Próximo
            </button>
            <button v-if="etapa === 3" @click="concluirFormulario"
                    class="bg-roxo text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-roxo-hover transition-colors">
              Concluir
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- ── Botão salvar (fora do card) ──────────────────────────────── -->
    <button
      class="w-full bg-laranja hover:bg-laranja-hover text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
      @click="salvarRascunho"
    >
      Salvar Alterações
    </button>

  </div>
</template>

<script setup>

  import { ref, reactive } from 'vue'
  import InputBase from '@/components/ui/InputBase.vue'

  const etapa       = ref(1)
  const dragAtivo   = ref(false)
  const buscandoCep = ref(false)
  const inputArquivo = ref(null)

  const passos = [
    { numero: 1, label: 'Dados Pessoais' },
    { numero: 2, label: 'Endereço' },
    { numero: 3, label: 'Detalhes Sobre O Ambiente' },
  ]

  const opcoesCustos = [
    { campo: 'racao',       label: 'Ração' },
    { campo: 'vacinas',     label: 'Vacinas' },
    { campo: 'veterinario', label: 'Veterinário' },
    { campo: 'castracao',   label: 'Castração' },
    { campo: 'emergencias', label: 'Emergências' },
  ]

  const opcoesRenda = [
    'Até 1 salário mínimo',
    '1-3 salários',
    '3-5 salários',
    'Acima de 5 salários',
  ]

  const form = reactive({
    // Etapa 1
    nome: '', sobrenome: '', dataNascimento: '', estadoCivil: '',
    cpf: '', email: '', whatsapp: '', documento: '',
    // Etapa 2
    cep: '', numero: '', rua: '', bairro: '', cidade: '', estado: '', complemento: '',
    tipoMoradia: '', tipoImovel: '', contratoPermiteAnimais: '',
    possuiQuintal: '', quintalFechado: '', alguemAlergia: '', pessoasResidencia: 1,
    // Etapa 3
    possuiOutrosAnimais: '', quantosAnimais: 1, especiesAnimais: '',
    saoCastrados: '', saoVacinados: '', observacaoAnimais: '',
    devolveuAnimal: '', horasSozinho: 0,
    custos: { racao: false, vacinas: false, veterinario: false, castracao: false, emergencias: false },
    rendaMensal: '', motivoAdocao: '', permiteVisitas: '', concordaTermos: '',
    declaraVeracidade: false,
  })

  // CEP: auto-preenche via ViaCEP quando completo
  async function onCepInput(e) {
    const apenasNumeros = e.target.value.replace(/\D/g, '')
    if (apenasNumeros.length === 8) {
      buscandoCep.value = true
      try {
        const res = await fetch(`https://viacep.com.br/ws/${apenasNumeros}/json/`)
        const dados = await res.json()
        if (!dados.erro) {
          form.rua    = dados.logradouro
          form.bairro = dados.bairro
          form.cidade = dados.localidade
          form.estado = dados.uf
        }
      } catch { /* silencioso */ }
      finally { buscandoCep.value = false }
    }
  }

  // Upload
  function aoSoltarArquivo(e) {
    dragAtivo.value = false
    const arquivo = e.dataTransfer.files[0]
    if (arquivo) form.documento = arquivo.name
  }

  function aoEscolherArquivo(e) {
    const arquivo = e.target.files[0]
    if (arquivo) form.documento = arquivo.name
  }

  function proximaEtapa() {
    if (etapa.value < 3) etapa.value++
  }

  function concluirFormulario() {
    etapa.value = 4
  }

  function concluir() {
    // Futuramente: redirecionar para solicitações
  }

  function salvarRascunho() {
    // Futuramente: persistir no backend
  }
</script>


<style scoped>
  .campo-rotulo {
    @apply text-sm font-semibold text-subtexto mb-2;
  }
  .campo-input {
    @apply w-full px-5 py-3 rounded-full text-sm bg-fundo border-[1.5px] border-gray-200 text-texto focus:border-roxo outline-none transition-all;
  }
  .campo-select {
    @apply w-full px-5 py-3 rounded-full text-sm bg-fundo border-[1.5px] border-gray-200 text-texto focus:border-roxo outline-none cursor-pointer;
  }
  .campo-textarea {
    @apply w-full px-4 py-3 rounded-xl text-sm bg-fundo border-[1.5px] border-gray-200 text-texto focus:border-roxo outline-none resize-none transition-all;
  }
  .radio-label {
    @apply flex items-center gap-1.5 text-sm text-texto cursor-pointer;
  }

  /* Transição entre etapas */
  .slide-etapa-enter-active,
  .slide-etapa-leave-active {
    transition: all 0.2s ease;
  }
  .slide-etapa-enter-from {
    opacity: 0;
    transform: translateX(16px);
  }
  .slide-etapa-leave-to {
    opacity: 0;
    transform: translateX(-16px);
  }
</style>
