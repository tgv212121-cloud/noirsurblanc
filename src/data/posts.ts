import { Post } from '@/types'

export const posts: Post[] = [
  // Mathieu Durand
  { id: 'p-01', clientId: 'cl-01', content: "J'ai perdu mon plus gros client il y a 6 mois.\n\nPas parce que mon travail était mauvais.\nParce que j'avais arrêté de l'écouter.\n\nLe consulting, c'est 20% d'expertise et 80% d'écoute active.\n\nVoici ce que j'ai changé depuis :", publishedAt: '2026-04-10', status: 'published', linkedinUrl: 'https://linkedin.com/posts/mathieudurand-1' },
  { id: 'p-02', clientId: 'cl-01', content: "3 erreurs que je vois chez 90% des consultants qui se lancent :\n\n1. Ils vendent du temps au lieu de vendre des résultats\n2. Ils sous-estiment la puissance du personal branding\n3. Ils n'ont aucun système de prospection\n\nLe pire ? Je les ai toutes faites.", publishedAt: '2026-04-07', status: 'published' },
  { id: 'p-03', clientId: 'cl-01', content: "Mon secret pour closer un client en un seul call ?\n\nJe ne parle pas de moi pendant les 15 premières minutes.\n\nJe pose des questions. J'écoute. Je reformule.\n\nQuand je parle enfin de ma solution, le client a déjà dit oui dans sa tête.", publishedAt: '2026-04-03', status: 'published' },
  { id: 'p-04', clientId: 'cl-01', content: "Le freelancing m'a appris une chose que le salariat ne m'avait jamais enseignée :\n\nTon revenu est directement proportionnel à la valeur que tu apportes.\n\nPas à tes heures. Pas à ton diplôme. À ta valeur.", publishedAt: '2026-03-28', status: 'published' },

  // Sophie Lefèvre
  { id: 'p-05', clientId: 'cl-02', content: "On a digitalisé 47 PME en 2025.\n\nLe point commun des échecs ?\nDes dirigeants qui voulaient un site web avant d'avoir une stratégie.\n\nLe digital sans direction, c'est un GPS sans destination.", publishedAt: '2026-04-11', status: 'published' },
  { id: 'p-06', clientId: 'cl-02', content: "Arrêtez de demander « combien coûte un site web ».\n\nDemandez plutôt : quel ROI je veux dans 6 mois ?\n\nLa réponse change tout le brief.", publishedAt: '2026-04-08', status: 'published' },
  { id: 'p-07', clientId: 'cl-02', content: "Un client m'a dit : « Sophie, on a dépensé 50K en marketing digital l'an dernier, zéro résultat. »\n\nJ'ai regardé leur analytics.\n\nIls n'avaient jamais défini ce qu'un « résultat » voulait dire.", publishedAt: '2026-04-04', status: 'published' },

  // Karim Benali
  { id: 'p-08', clientId: 'cl-03', content: "J'ai commencé avec 500€ et une idée.\n\n5 ans plus tard, K.B Ventures gère un portfolio de 12M€.\n\nCe qui a fait la différence ?\nPas le capital. La vitesse d'exécution.", publishedAt: '2026-04-09', status: 'published' },
  { id: 'p-09', clientId: 'cl-03', content: "Le meilleur investissement que j'ai fait cette année ?\n\nPas une startup.\nPas de l'immobilier.\n\nUn coach qui m'a fait réaliser que je confondais être occupé et être productif.", publishedAt: '2026-04-05', status: 'published' },
  { id: 'p-10', clientId: 'cl-03', content: "9 deals sur 10 échouent en due diligence.\n\nPas parce que les chiffres sont mauvais.\nParce que les fondateurs ne savent pas les présenter.\n\nLa narration financière, c'est un skill.", publishedAt: '2026-03-30', status: 'published' },

  // Camille Roux
  { id: 'p-11', clientId: 'cl-04', content: "Les dirigeants me demandent souvent :\n\"Comment je motive mes équipes ?\"\n\nMa réponse : arrêtez d'essayer de les motiver.\n\nCréez un environnement où la démotivation n'a pas de place.", publishedAt: '2026-04-10', status: 'published' },
  { id: 'p-12', clientId: 'cl-04', content: "J'ai accompagné un CEO qui travaillait 80h/semaine.\n\n6 mois plus tard, il en fait 45.\n\nSon chiffre d'affaires a augmenté de 30%.\n\nLe secret : il a appris à dire non.", publishedAt: '2026-04-06', status: 'published' },

  // Laura Petit
  { id: 'p-13', clientId: 'cl-06', content: "Le growth hacking est mort.\n\nLe growth thinking est vivant.\n\nLa différence ? Le premier cherche des raccourcis. Le second construit des systèmes.", publishedAt: '2026-04-11', status: 'published' },
  { id: 'p-14', clientId: 'cl-06', content: "Notre meilleur canal d'acquisition en 2026 ?\n\nLinkedIn. Pas les ads. Le contenu organique.\n\nCoût : 0€.\nRésultat : 34 leads qualifiés ce mois.", publishedAt: '2026-04-08', status: 'published' },

  // Julien Moreau
  { id: 'p-15', clientId: 'cl-07', content: "Quand j'ai quitté le Big 4, mes collègues pensaient que je faisais une erreur.\n\n2 ans plus tard, mon cabinet indépendant fait le même CA.\n\nAvec 4 personnes au lieu de 400.", publishedAt: '2026-04-09', status: 'published' },
  { id: 'p-16', clientId: 'cl-07', content: "Un bon associé, c'est quelqu'un qui te dit ce que tu ne veux pas entendre.\n\nPas quelqu'un qui acquiesce à tout.", publishedAt: '2026-04-02', status: 'published' },

  // Thomas Bernard
  { id: 'p-17', clientId: 'cl-09', content: "J'ai viré notre CRM cette semaine.\n\nRemplacé par un Notion + 3 automatisations.\n\nCoût : divisé par 8.\nAdoption par l'équipe : 100% dès le jour 1.\n\nLe meilleur outil, c'est celui que les gens utilisent.", publishedAt: '2026-04-10', status: 'published' },
  { id: 'p-18', clientId: 'cl-09', content: "Les développeurs les plus chers ne sont pas ceux qui codent le plus vite.\n\nCe sont ceux qui posent les bonnes questions avant de coder.", publishedAt: '2026-04-05', status: 'published' },

  // Chloé Martin
  { id: 'p-19', clientId: 'cl-10', content: "Je ne fais plus de coaching de « développement personnel ».\n\nJe fais du coaching de décisions.\n\nParce que ta vie est la somme de tes décisions, pas de tes intentions.", publishedAt: '2026-04-11', status: 'published' },
  { id: 'p-20', clientId: 'cl-10', content: "Mon client avait le syndrome de l'imposteur.\n\nIl dirigeait une boîte à 2M de CA.\n\nLe syndrome de l'imposteur ne disparaît pas quand tu réussis.\nIl change de costume.", publishedAt: '2026-04-07', status: 'published' },

  // Nicolas Faure
  { id: 'p-21', clientId: 'cl-11', content: "L'immobilier locatif est surévalué.\n\nLà. Je l'ai dit.\n\nLe rendement réel après impôts, charges et gestion ?\nSouvent inférieur à un bon ETF.\n\nSauf si tu optimises la fiscalité. Et ça, personne ne l'enseigne.", publishedAt: '2026-04-09', status: 'published' },

  // Rémi Garnier
  { id: 'p-22', clientId: 'cl-13', content: "J'ai dépensé 200K€ en Facebook Ads en 2025.\n\nROAS moyen : 1.2x.\n\nCette année, même budget, tout sur du contenu LinkedIn + email.\n\nROAS : 4.8x.\n\nLe paid media seul ne suffit plus.", publishedAt: '2026-04-10', status: 'published' },

  // Antoine Blanc
  { id: 'p-23', clientId: 'cl-15', content: "Le branding, ce n'est pas un logo.\n\nC'est la somme de chaque interaction que quelqu'un a avec ta marque.\n\nTon email de confirmation est du branding.\nTon message d'erreur 404 est du branding.\nTa facture est du branding.", publishedAt: '2026-04-11', status: 'published' },
  { id: 'p-24', clientId: 'cl-15', content: "Un client m'a demandé un « rebrand rapide ».\n\nIl voulait un nouveau logo en 48h.\n\nJe lui ai dit non.\n\nUn rebrand sans stratégie, c'est du maquillage sur une fracture.", publishedAt: '2026-04-06', status: 'published' },

  // Drafts
  { id: 'p-25', clientId: 'cl-01', content: "Draft : Le networking n'est pas mort. Il a juste changé de forme.\n\nAujourd'hui, un commentaire pertinent sur LinkedIn vaut 10 cartes de visite à un salon.", publishedAt: '2026-04-12', status: 'draft' },
  { id: 'p-26', clientId: 'cl-06', content: "Draft : Les 5 métriques que je regarde chaque lundi matin pour piloter la croissance de mes clients.", publishedAt: '2026-04-14', status: 'scheduled' },
]
