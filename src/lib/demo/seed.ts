// Données fake pour le mode démo. Tout est en mémoire / localStorage.

export type DemoClient = {
  id: string
  name: string
  company: string
  avatar: string
  email: string
  phone: string
  status: 'active' | 'onboarding' | 'paused'
  onboarded_at: string
  linkedin_url: string
  last_seen_at?: string | null
}

export type DemoPost = {
  id: string
  client_id: string
  content: string
  published_at: string
  status: 'draft' | 'scheduled' | 'published'
  linkedin_url?: string | null
  files?: { name: string; url: string; size?: number }[]
  validated_at?: string | null
  content_version?: number
}

export type DemoMetric = {
  post_id: string
  impressions: number
  likes: number
  comments: number
  reposts: number
  engagement_rate: number
  captured_at: string
}

export type DemoMessage = {
  id: string
  client_id: string
  sender: 'admin' | 'client'
  text: string | null
  file_url: string | null
  voice_url: string | null
  created_at: string
  edited_at?: string | null
  read_at?: string | null
  reply_to_id?: string | null
}

export type DemoAppointment = {
  id: string
  client_id: string | null
  scheduled_at: string
  duration_min: number
  status: 'confirmed' | 'cancelled'
  topic: string | null
  notes: string | null
  meeting_url: string | null
  prospect_name?: string | null
  prospect_email?: string | null
  prospect_company?: string | null
  google_event_id?: string | null
  client_google_event_id?: string | null
}

export type DemoData = {
  clients: DemoClient[]
  posts: DemoPost[]
  metrics: DemoMetric[]
  messages: DemoMessage[]
  appointments: DemoAppointment[]
  annotations: any[]
  postVersions: any[]
  reminders: any[]
  notificationEmails: any[]
  availabilityRules: any[]
  onboardingAnswers: any[]
}

const NOW = Date.now()
const day = (offset: number) => new Date(NOW + offset * 86400_000).toISOString()
const days = (offset: number) => new Date(NOW + offset * 86400_000)
const at = (offsetDays: number, hour: number, minute = 0): string => {
  const d = days(offsetDays)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function getInitialDemoData(): DemoData {
  const clients: DemoClient[] = [
    {
      id: 'demo-client-marie',
      name: 'Marie Dupont',
      company: 'Lumera',
      avatar: '',
      email: 'marie@lumera.fr',
      phone: '+33 6 12 34 56 78',
      status: 'active',
      onboarded_at: day(-90),
      linkedin_url: 'https://www.linkedin.com/in/marie-dupont-demo',
      last_seen_at: day(-0.05),
    },
    {
      id: 'demo-client-karim',
      name: 'Karim Lefebvre',
      company: 'Atelier 92',
      avatar: '',
      email: 'karim@atelier92.com',
      phone: '+33 6 89 12 34 56',
      status: 'active',
      onboarded_at: day(-45),
      linkedin_url: 'https://www.linkedin.com/in/karim-lefebvre-demo',
      last_seen_at: day(-2),
    },
    {
      id: 'demo-client-sophie',
      name: 'Sophie Mercier',
      company: 'Mercier Coaching',
      avatar: '',
      email: 'sophie@mercier-coaching.fr',
      phone: '+33 6 45 67 89 01',
      status: 'onboarding',
      onboarded_at: day(-7),
      linkedin_url: 'https://www.linkedin.com/in/sophie-mercier-demo',
      last_seen_at: day(-1),
    },
  ]

  const posts: DemoPost[] = [
    // Marie - Posts publiés
    { id: 'demo-post-m1', client_id: 'demo-client-marie', content: "Le plus dur dans la création de contenu B2B&nbsp;?\n\nCe n'est pas écrire.\nCe n'est pas filmer.\n\nC'est de tenir 6 mois sans voir de résultat tangible.\n\nLes 3 leçons que j'ai tirées après 200 posts publiés cette année.", published_at: day(-30), status: 'published', files: [], content_version: 1 },
    { id: 'demo-post-m2', client_id: 'demo-client-marie', content: "Aujourd'hui un prospect m'a dit&nbsp;:\n\n«&nbsp;On va voir, on a déjà un prestataire.&nbsp;»\n\nClassique. Voici ce que j'ai répondu (et qui a tout débloqué) :", published_at: day(-21), status: 'published', files: [], content_version: 1 },
    { id: 'demo-post-m3', client_id: 'demo-client-marie', content: "Stop avec le «&nbsp;personal branding&nbsp;».\n\nC'est devenu un mot fourre-tout vidé de sens.\n\nCe qui marche vraiment&nbsp;:\n\n→ Avoir une opinion claire\n→ La défendre en public\n→ Accepter de perdre des followers", published_at: day(-14), status: 'published', files: [], content_version: 1 },
    { id: 'demo-post-m4', client_id: 'demo-client-marie', content: "J'ai analysé 50 posts qui ont fait plus de 100k vues sur LinkedIn.\n\nUn pattern revient&nbsp;:\n\nLes 2 premières lignes contiennent une affirmation contre-intuitive.\n\nExemples&nbsp;:", published_at: day(-7), status: 'published', files: [], content_version: 1 },
    // Marie - Posts à valider (futur)
    { id: 'demo-post-m5', client_id: 'demo-client-marie', content: "«&nbsp;On va y réfléchir et on revient vers vous.&nbsp;»\n\nSi vous êtes commercial, vous avez entendu ça 1000 fois.\n\n80% du temps, c'est un soft no poli. Voici comment le détecter et le retourner.", published_at: at(2, 10), status: 'scheduled', files: [], content_version: 1 },
    { id: 'demo-post-m6', client_id: 'demo-client-marie', content: "J'ai relu 6 mois de feedback clients ce matin.\n\nUne phrase est revenue 14 fois&nbsp;:\n\n«&nbsp;On a enfin l'impression d'être pris au sérieux.&nbsp;»\n\nÇa résume tout ce qu'on essaie de construire.", published_at: at(4, 9), status: 'scheduled', files: [], content_version: 1 },
    { id: 'demo-post-m7', client_id: 'demo-client-marie', content: "Le piège du «&nbsp;personal branding&nbsp;» pour les CEO&nbsp;:\n\nÀ force de polir leur image, ils deviennent inaudibles.\n\nLes posts les plus performants de mes clients sont ceux où ils osent dire ce que leur communicant interne aurait barré.", published_at: at(7, 14, 30), status: 'scheduled', files: [], content_version: 2, validated_at: day(-1) },

    // Karim - Posts publiés
    { id: 'demo-post-k1', client_id: 'demo-client-karim', content: "L'erreur n°1 des consultants qui veulent passer à 10k€/mois&nbsp;:\n\nIls vendent leur temps.\n\nLa solution&nbsp;: vendre une transformation, pas des heures.", published_at: day(-25), status: 'published', files: [], content_version: 1 },
    { id: 'demo-post-k2', client_id: 'demo-client-karim', content: "5 ans de freelance, voici ce que j'aurais aimé savoir au début&nbsp;:\n\n1. Les meilleurs clients viennent du bouche-à-oreille\n2. Le plus rentable, c'est de dire non\n3. Ton positionnement vaut plus que ton expertise", published_at: day(-12), status: 'published', files: [], content_version: 1 },
    // Karim - Posts à valider
    { id: 'demo-post-k3', client_id: 'demo-client-karim', content: "Les agences qui scalent ne sont pas celles qui produisent le plus.\n\nCe sont celles qui ont automatisé tout ce qui n'apporte pas de valeur directe au client.", published_at: at(3, 10), status: 'scheduled', files: [], content_version: 1 },
    { id: 'demo-post-k4', client_id: 'demo-client-karim', content: "«&nbsp;On a besoin de plus de leads.&nbsp;»\n\nNon. Vous avez besoin de meilleurs leads.\n\nLa différence, c'est ce qui sépare 10k€/mois de 50k€/mois.", published_at: at(6, 14), status: 'scheduled', files: [], content_version: 1 },

    // Sophie - 1 post publié
    { id: 'demo-post-s1', client_id: 'demo-client-sophie', content: "Pourquoi je refuse 80% des prospects qui me contactent&nbsp;:\n\n«&nbsp;Coach professionnel&nbsp;» est devenu un terme tellement large que le marché est saturé. La seule façon de sortir du lot, c'est de servir une niche précise.", published_at: day(-3), status: 'published', files: [], content_version: 1 },
    // Sophie - Posts à valider
    { id: 'demo-post-s2', client_id: 'demo-client-sophie', content: "Le coaching qui marche vraiment ne ressemble pas à ce qu'on vend sur Instagram.\n\n70% du temps, c'est dire au client ce qu'il ne veut pas entendre.", published_at: at(2, 11), status: 'scheduled', files: [], content_version: 1 },
    { id: 'demo-post-s3', client_id: 'demo-client-sophie', content: "Mes 3 clients qui ont le plus progressé cette année avaient un point commun&nbsp;:\n\nIls étaient incapables de me dire ce qu'ils voulaient en première séance.\n\nIls ont accepté d'explorer.", published_at: at(5, 9, 30), status: 'scheduled', files: [], content_version: 1 },
  ]

  const metrics: DemoMetric[] = posts
    .filter(p => p.status === 'published')
    .map(p => {
      const impressions = 2000 + Math.floor(Math.random() * 18000)
      const likes = Math.floor(impressions * (0.02 + Math.random() * 0.04))
      const comments = Math.floor(impressions * (0.005 + Math.random() * 0.01))
      const reposts = Math.floor(impressions * (0.001 + Math.random() * 0.005))
      return {
        post_id: p.id,
        impressions,
        likes,
        comments,
        reposts,
        engagement_rate: ((likes + comments + reposts) / impressions) * 100,
        captured_at: p.published_at,
      }
    })

  const messages: DemoMessage[] = [
    // Marie
    { id: 'demo-msg-m1', client_id: 'demo-client-marie', sender: 'admin', text: "Salut Marie, j'ai préparé 3 nouveaux posts pour cette semaine. Jette un œil quand tu peux.", file_url: null, voice_url: null, created_at: day(-2), read_at: day(-1.9) },
    { id: 'demo-msg-m2', client_id: 'demo-client-marie', sender: 'client', text: "Top, je regarde ce soir et je te confirme.", file_url: null, voice_url: null, created_at: day(-1.95), read_at: day(-1.9) },
    { id: 'demo-msg-m3', client_id: 'demo-client-marie', sender: 'client', text: "C'est validé pour les 3. J'ai mis quelques retouches sur le second, regarde les commentaires.", file_url: null, voice_url: null, created_at: day(-1), read_at: day(-0.9) },
    { id: 'demo-msg-m4', client_id: 'demo-client-marie', sender: 'admin', text: "Parfait, je prends en compte. Je te repropose une v2 demain matin.", file_url: null, voice_url: null, created_at: day(-0.5), read_at: day(-0.4) },

    // Karim
    { id: 'demo-msg-k1', client_id: 'demo-client-karim', sender: 'admin', text: "Karim, j'aimerais qu'on parle de la stratégie pour le mois prochain. Tu as 30 min mardi&nbsp;?", file_url: null, voice_url: null, created_at: day(-3), read_at: day(-2.9) },
    { id: 'demo-msg-k2', client_id: 'demo-client-karim', sender: 'client', text: "Oui, jeudi 14h ça te va&nbsp;?", file_url: null, voice_url: null, created_at: day(-2.5), read_at: day(-2.4) },

    // Sophie
    { id: 'demo-msg-s1', client_id: 'demo-client-sophie', sender: 'admin', text: "Bienvenue Sophie. Ton onboarding est presque fini, il manque juste 2 réponses.", file_url: null, voice_url: null, created_at: day(-5), read_at: day(-4.5) },
    { id: 'demo-msg-s2', client_id: 'demo-client-sophie', sender: 'client', text: "Je termine ce soir, promis.", file_url: null, voice_url: null, created_at: day(-4.8), read_at: day(-4.7) },
  ]

  const appointments: DemoAppointment[] = [
    { id: 'demo-apt-1', client_id: 'demo-client-marie', scheduled_at: at(2, 10, 0), duration_min: 30, status: 'confirmed', topic: 'Point stratégie posts', notes: null, meeting_url: 'https://meet.google.com/demo-abc-xyz' },
    { id: 'demo-apt-2', client_id: 'demo-client-karim', scheduled_at: at(4, 14, 0), duration_min: 30, status: 'confirmed', topic: 'Revue performances trimestre', notes: null, meeting_url: 'https://meet.google.com/demo-def-uvw' },
    { id: 'demo-apt-3', client_id: 'demo-client-sophie', scheduled_at: at(7, 11, 0), duration_min: 30, status: 'confirmed', topic: null, notes: null, meeting_url: 'https://meet.google.com/demo-ghi-rst' },
  ]

  const availabilityRules = [
    { id: 'demo-rule-1', day_of_week: 1, start_time: '10:00', end_time: '12:00', slot_duration_min: 30, enabled: true },
    { id: 'demo-rule-2', day_of_week: 2, start_time: '14:00', end_time: '17:00', slot_duration_min: 30, enabled: true },
    { id: 'demo-rule-3', day_of_week: 4, start_time: '14:00', end_time: '16:00', slot_duration_min: 30, enabled: true },
  ]

  const annotations = [
    {
      id: 'demo-ann-1',
      post_id: 'demo-post-m7',
      client_id: 'demo-client-marie',
      start_offset: 28,
      end_offset: 73,
      selected_text: "À force de polir leur image, ils deviennent inaudibles.",
      text_content: "J'aime cette phrase, mais on pourrait la rendre plus directe&nbsp;: «&nbsp;À force de se polir, ils s'éteignent.&nbsp;»",
      voice_url: null,
      created_at: day(-2),
      post_version: 1,
      archived_at: null,
    },
  ]

  const postVersions: any[] = []

  return {
    clients,
    posts,
    metrics,
    messages,
    appointments,
    annotations,
    postVersions,
    reminders: [],
    notificationEmails: [],
    availabilityRules,
    onboardingAnswers: [],
  }
}
