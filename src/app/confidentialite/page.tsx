import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = { title: 'Politique de confidentialité — Noirsurblanc' }

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" subtitle="Dernière mise à jour : 16 avril 2026">
      <p>
        La présente Politique de confidentialité (« Politique ») a pour objet d&apos;informer les utilisateurs
        (« Utilisateurs », « vous ») du site <strong>Noirsurblanc</strong> (« le Site ») sur la manière dont leurs données
        à caractère personnel sont collectées et traitées par l&apos;éditeur, conformément au Règlement (UE) 2016/679
        du 27 avril 2016 relatif à la protection des personnes physiques à l&apos;égard du traitement des données
        à caractère personnel (« RGPD ») et à la loi n° 78-17 du 6 janvier 1978 modifiée (« Loi Informatique et Libertés »).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est&nbsp;:
      </p>
      <ul>
        <li><strong>[Nom / raison sociale]</strong> — [À COMPLÉTER]</li>
        <li>Adresse : [À COMPLÉTER]</li>
        <li>Email : <strong>[email contact]</strong></li>
        <li>SIRET : [À COMPLÉTER]</li>
      </ul>
      <p>
        Pour toute question relative au traitement de vos données, vous pouvez écrire à l&apos;adresse
        <strong> [email contact privacy] </strong>.
      </p>

      <h2>2. Données collectées</h2>
      <p>Dans le cadre de l&apos;utilisation du Site, les données suivantes sont susceptibles d&apos;être collectées&nbsp;:</p>

      <h3>Données d&apos;identification et de contact</h3>
      <ul>
        <li>Prénom et nom</li>
        <li>Adresse email</li>
        <li>Numéro de téléphone (facultatif)</li>
        <li>Nom de votre entreprise</li>
        <li>URL de votre profil LinkedIn</li>
      </ul>

      <h3>Données de compte</h3>
      <ul>
        <li>Identifiant unique (UUID généré)</li>
        <li>Mot de passe (stocké sous forme de hash irréversible via Supabase Auth)</li>
        <li>Date de création du compte et date de dernière connexion</li>
      </ul>

      <h3>Données liées au service</h3>
      <ul>
        <li>Réponses au questionnaire d&apos;onboarding</li>
        <li>Contenu des messages échangés (texte, fichiers joints, messages vocaux)</li>
        <li>Contenu des publications LinkedIn rédigées dans l&apos;outil</li>
        <li>Statistiques d&apos;engagement renseignées (impressions, likes, commentaires, taux d&apos;engagement)</li>
      </ul>

      <h3>Données techniques</h3>
      <ul>
        <li>Adresse IP (conservée uniquement dans les logs techniques de nos hébergeurs)</li>
        <li>Type de navigateur, système d&apos;exploitation, langue</li>
      </ul>

      <p>
        <strong>Aucune donnée sensible</strong> au sens de l&apos;article 9 du RGPD (origine, opinions politiques, convictions religieuses,
        données de santé, etc.) n&apos;est collectée par le Site.
      </p>

      <h2>3. Finalités et bases légales des traitements</h2>

      <h3>a) Gestion du compte utilisateur et fourniture du service</h3>
      <p>
        Création, maintien et sécurisation de votre compte, authentification, gestion du portail client, personnalisation
        du contenu éditorial produit pour vous.
      </p>
      <p><strong>Base légale</strong> : exécution du contrat liant l&apos;Utilisateur à l&apos;éditeur (article 6.1.b RGPD).</p>

      <h3>b) Communication et support</h3>
      <p>
        Réponse aux demandes, échanges via la messagerie intégrée, notifications relatives au service.
      </p>
      <p><strong>Base légale</strong> : exécution du contrat et intérêt légitime (article 6.1.b et 6.1.f RGPD).</p>

      <h3>c) Respect des obligations légales</h3>
      <p>
        Conservation des données nécessaires à la facturation, à la comptabilité, à la lutte contre la fraude et à la
        réponse à toute réquisition judiciaire.
      </p>
      <p><strong>Base légale</strong> : obligation légale (article 6.1.c RGPD).</p>

      <h3>d) Amélioration du service</h3>
      <p>
        Mesure d&apos;audience interne, correction de bogues, amélioration de l&apos;ergonomie.
      </p>
      <p><strong>Base légale</strong> : intérêt légitime du responsable du traitement (article 6.1.f RGPD).</p>

      <h2>4. Destinataires des données</h2>
      <p>
        Les données collectées sont traitées par l&apos;éditeur et ses <strong>sous-traitants</strong>, dans le strict respect
        de leurs finalités. Aucun transfert à des tiers à des fins commerciales n&apos;est effectué.
      </p>
      <p>Nos sous-traitants actuels sont&nbsp;:</p>
      <ul>
        <li><strong>Vercel Inc.</strong> (États-Unis) — hébergement du Site. Transfert encadré par les Clauses Contractuelles Types (CCT) de la Commission européenne.</li>
        <li><strong>Supabase Inc.</strong> (Singapour, infrastructure UE disponible) — base de données, authentification, stockage de fichiers. Transfert encadré par les CCT.</li>
        <li><strong>Resend, Inc.</strong> (États-Unis) — envoi des emails transactionnels (confirmation, réinitialisation de mot de passe). Transfert encadré par les CCT.</li>
      </ul>
      <p>
        Chacun de ces sous-traitants s&apos;est engagé contractuellement à respecter le RGPD et à mettre en œuvre les
        mesures techniques et organisationnelles appropriées.
      </p>

      <h2>5. Transferts hors Union européenne</h2>
      <p>
        Certaines données peuvent être transférées en dehors de l&apos;Espace économique européen (États-Unis notamment)
        dans le cadre de notre recours aux sous-traitants listés ci-dessus. Ces transferts sont encadrés par des
        <strong> Clauses Contractuelles Types </strong> adoptées par la Commission européenne (Décision 2021/914),
        garantissant un niveau de protection équivalent à celui du RGPD.
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li><strong>Données de compte actif</strong> : pendant toute la durée de la relation contractuelle.</li>
        <li><strong>Données de compte clôturé</strong> : supprimées dans un délai de 30 jours après la demande de suppression, sauf obligation légale contraire.</li>
        <li><strong>Données de facturation</strong> : conservées 10 ans à compter de la fin de l&apos;exercice comptable (article L.123-22 du Code de commerce).</li>
        <li><strong>Logs techniques</strong> : 12 mois maximum.</li>
        <li><strong>Prospects inactifs</strong> : 3 ans à compter du dernier contact.</li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>
        Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants sur vos données personnelles&nbsp;:
      </p>
      <ul>
        <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données.</li>
        <li><strong>Droit de rectification</strong> : corriger des données inexactes ou incomplètes.</li>
        <li><strong>Droit à l&apos;effacement</strong> (« droit à l&apos;oubli ») : demander la suppression de vos données.</li>
        <li><strong>Droit à la limitation</strong> du traitement.</li>
        <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré et couramment utilisé.</li>
        <li><strong>Droit d&apos;opposition</strong> au traitement pour motif légitime.</li>
        <li><strong>Droit de définir des directives post-mortem</strong> sur la conservation de vos données.</li>
        <li><strong>Droit de retirer votre consentement</strong> à tout moment lorsque le traitement est fondé sur celui-ci.</li>
      </ul>
      <p>
        Pour exercer ces droits, adressez-nous un email à <strong>[email contact privacy]</strong> accompagné d&apos;un
        justificatif d&apos;identité. Nous vous répondrons dans un délai maximum d&apos;un mois à compter de la réception
        de votre demande.
      </p>
      <p>
        Vous avez également le droit d&apos;introduire une réclamation auprès de la <strong>Commission Nationale de
        l&apos;Informatique et des Libertés (CNIL)</strong>&nbsp;:
      </p>
      <ul>
        <li>3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07</li>
        <li>Téléphone : 01 53 73 22 22</li>
        <li>Site : <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">www.cnil.fr</a></li>
      </ul>

      <h2>8. Sécurité des données</h2>
      <p>
        Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour garantir la sécurité
        et la confidentialité de vos données&nbsp;:
      </p>
      <ul>
        <li>Chiffrement des données en transit (HTTPS/TLS 1.3)</li>
        <li>Chiffrement au repos des bases de données et des fichiers stockés</li>
        <li>Mots de passe stockés sous forme de hash bcrypt irréversible</li>
        <li>Contrôle d&apos;accès par rôle (admin / client) via Row Level Security (RLS) Supabase</li>
        <li>Journalisation des accès aux données sensibles</li>
        <li>Mises à jour régulières des dépendances et audits de sécurité</li>
      </ul>
      <p>
        En cas de <strong>violation de données</strong> susceptible d&apos;engendrer un risque pour vos droits et libertés,
        nous nous engageons à notifier la CNIL dans un délai de 72 heures et à vous informer sans délai conformément aux
        articles 33 et 34 du RGPD.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Le Site utilise uniquement les cookies <strong>strictement nécessaires</strong> à son fonctionnement&nbsp;:
      </p>
      <ul>
        <li><strong>Cookie de session</strong> (Supabase Auth) : maintient l&apos;utilisateur connecté. Durée : 7 jours.</li>
      </ul>
      <p>
        Ces cookies étant indispensables au fonctionnement du Site, ils ne nécessitent pas de consentement préalable
        (article 82 de la loi Informatique et Libertés). <strong>Aucun cookie publicitaire, de traçage ou tiers</strong>
        n&apos;est déposé.
      </p>

      <h2>10. Mineurs</h2>
      <p>
        Le Site n&apos;est pas destiné aux personnes âgées de moins de 15 ans. Si vous avez moins de 15 ans, n&apos;utilisez pas
        ce Site et ne nous fournissez pas vos données personnelles sans l&apos;autorisation de votre représentant légal.
      </p>

      <h2>11. Modifications</h2>
      <p>
        La présente Politique pourra être modifiée à tout moment pour refléter des évolutions réglementaires ou des changements
        dans nos pratiques. La date de dernière mise à jour indiquée en tête de page fait foi. En cas de modification substantielle,
        nous vous en informerons par email.
      </p>

      <h2>12. Contact</h2>
      <p>
        Pour toute question relative à la présente Politique, vous pouvez nous contacter à l&apos;adresse
        <strong> [email contact privacy]</strong>.
      </p>
    </LegalLayout>
  )
}
