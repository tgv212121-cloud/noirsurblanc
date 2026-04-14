export type QuestionField = {
  label: string
  placeholder: string
}

export type Question = {
  id: number
  question: string
  subtitle?: string
  type: 'textarea' | 'text' | 'multi-input' | 'triple-input'
  placeholder?: string
  fields?: QuestionField[]
  large?: boolean
}

export const questions: Question[] = [
  {
    id: 1,
    question: "Quel est ton objectif ultime sur LinkedIn ?",
    type: "textarea",
    placeholder: "Ex: Devenir une référence dans mon domaine, générer des leads qualifiés...",
  },
  {
    id: 2,
    question: "Quelle image voudrais-tu renvoyer de toi ?",
    type: "textarea",
    placeholder: "Ex: Expert accessible, leader inspirant, entrepreneur audacieux...",
  },
  {
    id: 3,
    question: "Quelles sont tes attentes ?",
    subtitle: "Abonnés, followers, CA généré",
    type: "multi-input",
    fields: [
      { label: "3 mois", placeholder: "Ex: 1000 abonnés, 2 clients" },
      { label: "6 mois", placeholder: "Ex: 3000 abonnés, 5 clients" },
      { label: "1 an", placeholder: "Ex: 10 000 abonnés, 15 clients" },
      { label: "3 ans", placeholder: "Ex: 50 000 abonnés, leader du marché" },
    ],
  },
  {
    id: 4,
    question: "Les 3 gros sujets principaux que tu voudrais aborder ?",
    type: "triple-input",
    fields: [
      { label: "Sujet 1", placeholder: "Ex: Leadership" },
      { label: "Sujet 2", placeholder: "Ex: Stratégie business" },
      { label: "Sujet 3", placeholder: "Ex: Mindset entrepreneurial" },
    ],
  },
  {
    id: 5,
    question: "Des informations utiles sur toi et ton business ?",
    type: "textarea",
    placeholder: "Parle-moi de ton activité, ton positionnement, ce qui te différencie...",
  },
  {
    id: 6,
    question: "Raconte-moi ton parcours entrepreneurial",
    type: "textarea",
    placeholder: "D'où tu viens, comment tu en es arrivé là, les moments clés...",
    large: true,
  },
  {
    id: 7,
    question: "Un accès à tes formations, coaching ?",
    subtitle: "Si tu en as",
    type: "textarea",
    placeholder: "Liens vers tes formations, programmes de coaching, masterclass...",
  },
  {
    id: 8,
    question: "Ressources utiles pour partager des conseils pertinents",
    subtitle: "Youtube, Blog, newsletter, webinaire, formation",
    type: "textarea",
    placeholder: "Partage les liens de tes contenus existants...",
  },
  {
    id: 9,
    question: "Si tu pouvais échanger ton audience avec quelqu'un, ce serait qui ?",
    subtitle: "Peu importe si c'est sur Twitter, Insta ou YouTube — FR ou US",
    type: "textarea",
    placeholder: "Ex: Alex Hormozi, Yomi Denzel, Guillaume Moubeche...",
  },
  {
    id: 10,
    question: "Quel compte poste déjà comme tu voudrais le faire ?",
    subtitle: "FR ou US",
    type: "textarea",
    placeholder: "Ex: @justinwelsh, @GabyFauchier...",
  },
  {
    id: 11,
    question: "Tu te focalises sur quoi quand tu montes une audience ?",
    type: "textarea",
    placeholder: "Ex: La valeur ajoutée, la régularité, l'engagement...",
  },
  {
    id: 12,
    question: "Quel genre de personnes aimerais-tu avoir dans tes DMs ?",
    type: "textarea",
    placeholder: "Ex: CEOs de PME, freelances ambitieux, directeurs marketing...",
  },
  {
    id: 13,
    question: "Qui est ton client idéal ?",
    type: "textarea",
    placeholder: "Décris ton avatar client : son profil, ses problèmes, son budget...",
  },
  {
    id: 14,
    question: "Quel est le cheminement type de ton client sur LinkedIn pour arriver à l'achat ?",
    type: "textarea",
    placeholder: "Ex: Voit un post → visite le profil → envoie un DM → appel découverte → achat",
    large: true,
  },
  {
    id: 15,
    question: "Sur quel lien envoyer les prospects ?",
    subtitle: "Si tu veux que je gère ta messagerie",
    type: "text",
    placeholder: "https://...",
  },
  {
    id: 16,
    question: "Pourquoi c'est important pour toi de monter une audience ?",
    type: "textarea",
    placeholder: "Ta motivation profonde, ce que ça changerait pour toi...",
  },
  {
    id: 17,
    question: "Si ton audience avait un ou plusieurs ennemis communs, ce serait qui ?",
    type: "textarea",
    placeholder: "Ex: Le syndrome de l'imposteur, les formations bidons, le salariat toxique...",
  },
]
