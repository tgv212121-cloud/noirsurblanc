import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = { title: 'Mentions légales · Noirsurblanc' }

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" subtitle="Dernière mise à jour : 16 avril 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>Noirsurblanc</strong> (ci-après « le Site ») est édité par&nbsp;:
      </p>
      <ul>
        <li><strong>Nom / raison sociale</strong> : Enzo Chabbi, entrepreneur individuel (micro-entreprise)</li>
        <li><strong>Adresse</strong> : 411 Grande Rue, 78955 Carrières-sous-Poissy, France</li>
        <li><strong>Email</strong> : <a href="mailto:enzochab3@gmail.com">enzochab3@gmail.com</a></li>
        <li><strong>Téléphone</strong> : <a href="tel:+33651821755">+33 6 51 82 17 55</a></li>
        <li><strong>SIRET</strong> : 100 291 731 00014</li>
        <li><strong>Numéro TVA intracommunautaire</strong> : non applicable (franchise en base de TVA, article 293 B du CGI)</li>
        <li><strong>Directeur de la publication</strong> : Enzo Chabbi</li>
      </ul>

      <h2>Hébergement</h2>
      <p>Le Site est hébergé par&nbsp;:</p>
      <ul>
        <li><strong>Vercel Inc.</strong></li>
        <li>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
        <li>Site web&nbsp;: <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a></li>
      </ul>
      <p>
        La base de données et les services d&apos;authentification sont fournis par <strong>Supabase Inc.</strong>,
        970 Toa Payoh North, #07-04, Singapore 318992.
      </p>
      <p>
        L&apos;envoi d&apos;emails transactionnels est assuré par <strong>Resend, Inc.</strong>, 2261 Market Street #5039, San Francisco, CA 94114, États-Unis.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du Site (textes, graphismes, logos, icônes, images, codes sources) est la propriété
        exclusive de l&apos;éditeur ou de ses partenaires, et est protégé par le droit d&apos;auteur et les droits voisins.
        Toute reproduction, représentation, modification ou diffusion, totale ou partielle, sans autorisation écrite préalable
        est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
      </p>
      <p>
        La marque « Noirsurblanc » ainsi que son logo sont la propriété exclusive de l&apos;éditeur.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données à caractère personnel collectées sur le Site est régi par notre <a href="/confidentialite">Politique de confidentialité</a>,
        conformément au Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée (Informatique et Libertés).
      </p>

      <h2>Cookies</h2>
      <p>
        Le Site utilise uniquement des cookies strictement nécessaires à son fonctionnement (notamment le maintien de la session utilisateur).
        Aucun cookie publicitaire ou de traçage tiers n&apos;est déposé sans votre consentement préalable.
      </p>

      <h2>Responsabilité</h2>
      <p>
        L&apos;éditeur met tout en œuvre pour assurer l&apos;exactitude et la mise à jour des informations diffusées sur le Site, dont il se réserve
        le droit de corriger le contenu à tout moment et sans préavis. L&apos;éditeur ne saurait toutefois être tenu responsable des erreurs, d&apos;une
        absence de disponibilité des informations ou de la présence de virus sur le Site.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative au Site, vous pouvez nous contacter à l&apos;adresse <strong>enzochab3@gmail.com</strong>.
      </p>
    </LegalLayout>
  )
}
