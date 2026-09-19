/**
 * Two languages, one table.
 *
 * No i18n library. There are two locales and about sixty strings, all of them
 * ours, and nothing here needs plurals, gendered agreement or date formats —
 * the one place that formats a number reads it through the speech synthesiser,
 * not through Intl. A library would add a dependency, a loader and a key
 * namespace to solve problems this screen does not have.
 *
 * The table is typed off the English side, so a missing Portuguese key is a
 * build error rather than an English word appearing mid-sentence in a demo.
 *
 * What this does NOT cover, on purpose:
 *   - The boot log (Boot.tsx). It is set dressing pretending to be a mainframe,
 *     not language, and `CHECKSUM ..... OK` reads the same in both.
 *   - JARVIS's own answers. Nothing tells the model what to speak; it follows
 *     whoever is talking to it, which is the behaviour you want and is already
 *     steered by the transcription language.
 */

export type Lang = 'en' | 'pt'

const en = {
  // Phase readout, centre of the HUD.
  statusOffline: 'OFFLINE',
  statusBoot: 'INITIALISING',
  statusDormant: 'STANDBY — SAY “HEY JARVIS”',
  statusWaking: 'ONLINE',
  statusListening: 'LISTENING',
  statusThinking: 'PROCESSING',
  statusTooling: 'ACCESSING SYSTEMS',
  statusSpeaking: 'RESPONDING',

  // Rails and controls.
  signal: 'SIGNAL',
  muted: 'MUTED',
  noInput: 'NO INPUT',
  micOn: 'MIC ON',
  micOff: 'MIC OFF',
  noiseStrict: 'NOISE STRICT',
  noiseStandard: 'NOISE STD',
  speakerYou: 'YOU',
  speakerJarvis: 'JARVIS',
  screenShare: 'Screen share',
  camera: 'Camera',
  handControl: 'HAND CONTROL',
  initialise: 'INITIALISE',

  // Settings panel.
  settingsModel: 'Model',
  settingsEffort: 'Effort',
  settingsLanguage: 'Language',
  settingsNoise: 'Noise guard',
  settingsConversation: 'Conversation',
  settingsCurrent: 'Current',
  settingsDefault: 'Default',
  settingsDefaultFromSettings: 'Default (from settings)',
  noiseStandardOption: 'Standard',
  noiseStrictOption: 'Strict (nothing heard while he speaks)',
  newConversation: 'NEW CONVERSATION',
  newConversationHint: 'Forget this conversation and start over',
  resumeHint: 'Go back to an earlier conversation',
  resumedNote: 'resumed from last time',
  freshNote: 'fresh session',

  // Gesture guide.
  gesturePoint: 'move the cursor',
  gesturePinch: 'grab a blade · move it · press',
  gestureOpen: 'let go',
  gesturePeace: 'two fingers up-down to scroll',
  gestureFrame: 'two L-corners to resize',

  // Notices and errors.
  errGeneric: 'Something went wrong.',
  errNoAudio: 'No audio from the microphone — check it is not in use elsewhere, or reload.',
  errPowerUp: 'Power-up failed. Click to try again.',
  errMicDenied: 'Microphone access denied — voice input is unavailable.',
  errMicRefused: 'Microphone access was refused — voice input is unavailable.',
  errNoMic: 'No microphone available.',
  errNoRecorder: 'This browser cannot record audio — voice input is unavailable.',
  errNoRecognition:
    'This browser has no speech recognition — use Chrome or Edge, or run the bridge for transcription.',
  errCameraDenied: 'Camera access denied — gesture control is unavailable.',
  errCameraNotPermitted: 'The camera is not permitted, so I cannot see anything.',
  errNoFootage:
    'There is no recent footage — the camera has to be open on screen ' +
    'for me to remember what just happened. Ask me to open the camera, ' +
    'and I can watch from then on.',
  errShortFootage: 'There is not enough recent footage to review.',
  errScreenCancelled: 'Screen sharing was cancelled.',
  errCameraNotAllowed: 'Camera access is not permitted.',
  noticeBridgeLost: 'Bridge connection lost — reconnecting.',
  noticeBridgeBack: 'Bridge reconnected. The previous conversation was not kept.',
  audioTest: 'Audio test. If you can hear this, speech output is working, sir.',
  imageUnavailable: 'image unavailable',
  videoUnavailable: 'video unavailable',
} as const

export type StringKey = keyof typeof en

const pt: Record<StringKey, string> = {
  statusOffline: 'DESLIGADO',
  statusBoot: 'INICIALIZANDO',
  statusDormant: 'EM ESPERA — DIGA “EI JARVIS”',
  statusWaking: 'ONLINE',
  statusListening: 'OUVINDO',
  statusThinking: 'PROCESSANDO',
  statusTooling: 'ACESSANDO SISTEMAS',
  statusSpeaking: 'RESPONDENDO',

  signal: 'SINAL',
  muted: 'MUDO',
  noInput: 'SEM ÁUDIO',
  micOn: 'MIC LIGADO',
  micOff: 'MIC DESLIGADO',
  noiseStrict: 'RUÍDO ESTRITO',
  noiseStandard: 'RUÍDO PADRÃO',
  speakerYou: 'VOCÊ',
  speakerJarvis: 'JARVIS',
  screenShare: 'Compartilhar tela',
  camera: 'Câmera',
  handControl: 'CONTROLE POR GESTOS',
  initialise: 'INICIALIZAR',

  settingsModel: 'Modelo',
  settingsEffort: 'Esforço',
  settingsLanguage: 'Idioma',
  settingsNoise: 'Filtro de ruído',
  settingsConversation: 'Conversa',
  settingsCurrent: 'Atual',
  settingsDefault: 'Padrão',
  settingsDefaultFromSettings: 'Padrão (das configurações)',
  noiseStandardOption: 'Padrão',
  noiseStrictOption: 'Estrito (não ouve nada enquanto ele fala)',
  newConversation: 'NOVA CONVERSA',
  newConversationHint: 'Esquecer esta conversa e começar do zero',
  resumeHint: 'Voltar a uma conversa anterior',
  resumedNote: 'retomada da última vez',
  freshNote: 'sessão nova',

  gesturePoint: 'mover o cursor',
  gesturePinch: 'pegar uma lâmina · mover · apertar',
  gestureOpen: 'soltar',
  gesturePeace: 'dois dedos para cima e para baixo para rolar',
  gestureFrame: 'dois L com as mãos para redimensionar',

  errGeneric: 'Algo deu errado.',
  errNoAudio: 'Nenhum áudio do microfone — verifique se ele não está em uso em outro lugar, ou recarregue.',
  errPowerUp: 'Falha ao ligar. Clique para tentar de novo.',
  errMicDenied: 'Acesso ao microfone negado — entrada de voz indisponível.',
  errMicRefused: 'Acesso ao microfone recusado — entrada de voz indisponível.',
  errNoMic: 'Nenhum microfone disponível.',
  errNoRecorder: 'Este navegador não consegue gravar áudio — entrada de voz indisponível.',
  errNoRecognition:
    'Este navegador não tem reconhecimento de fala — use Chrome ou Edge, ou rode o bridge para transcrever.',
  errCameraDenied: 'Acesso à câmera negado — controle por gestos indisponível.',
  errCameraNotPermitted: 'A câmera não está permitida, então não consigo ver nada.',
  errNoFootage:
    'Não há imagem recente — a câmera precisa estar aberta na tela ' +
    'para eu lembrar do que acabou de acontecer. Peça para eu abrir a câmera, ' +
    'e eu passo a observar a partir dali.',
  errShortFootage: 'Não há imagem recente suficiente para revisar.',
  errScreenCancelled: 'O compartilhamento de tela foi cancelado.',
  errCameraNotAllowed: 'O acesso à câmera não está permitido.',
  noticeBridgeLost: 'Conexão com o bridge perdida — reconectando.',
  noticeBridgeBack: 'Bridge reconectado. A conversa anterior não foi mantida.',
  audioTest: 'Teste de áudio. Se você está ouvindo isto, a saída de voz está funcionando, senhor.',
  imageUnavailable: 'imagem indisponível',
  videoUnavailable: 'vídeo indisponível',
}

const TABLE: Record<Lang, Record<StringKey, string>> = { en, pt }

/**
 * Read one string.
 *
 * Takes the language rather than reaching into the store, so it can be called
 * from the audio and voice modules, which have no React and no business
 * subscribing to anything.
 */
export function t(lang: Lang, key: StringKey): string {
  return TABLE[lang][key]
}

/** ISO 639-1, for the transcriber and the speech synthesiser. */
export const iso = (lang: Lang): string => (lang === 'pt' ? 'pt' : 'en')
