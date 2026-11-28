"""Présentation direction et actionnaires : format paysage, une idée par page, grands chiffres."""
import json

I = json.load(open('icones.json'))
def ic(n, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{I[n]}</svg>'
def tuile(n, cls=""): return f'<span class="tuile {cls}">{ic(n)}</span>'
CARRES = '<svg class="carres" viewBox="5 23 43 43"><path fill="currentColor" d="M5.19 23.15H26.4v21.22H5.19zM32.09 23.15h15.53v15.53H32.09zM5.19 50.05h15.53v15.53H5.19zM26.4 44.36h21.21v21.22H26.4z"/></svg>'
def pied(n, clair=False): return f'<div class="pied{" clair" if clair else ""}"><span>{CARRES}Espace Pro Picard Serrures</span><span>{n:02d}</span></div>'
def sur(icone, texte): return f'<p class="sur">{ic(icone, "si")}{texte}</p>'

CSS = open('deck.css').read()
S = []

# 1. Couverture
S.append(f'''<section class="slide nuit couverture">
  <div class="gauche">
    <img class="logo" src="logo-blanc.svg" alt="Picard Serrures">
    <h1>Un seul outil.<br>Tout le réseau.<br><em>En 30 jours.</em></h1>
    <p class="accroche">L’Espace Pro réunit leads, SAV, configurateur, commandes, documentation, fidélité et pilotage dans une seule plateforme sécurisée, aux couleurs de Picard.</p>
  </div>
  <div class="droite"><div class="mega">{CARRES}<b>Espace Pro</b><span>Présentation à la direction et aux actionnaires</span></div></div>
</section>''')

# 2. Le constat
S.append(f'''<section class="slide">
  {sur("triangle-exclamation-point","Le constat")}
  <h2>Aujourd’hui, le réseau travaille <em>en morceaux.</em></h2>
  <div class="chiffres4">
    <div><b>6</b><span>outils et canaux dispersés</span><small>Dropbox, Enet, Qualios, MyPricer, Excel, e-mails</small></div>
    <div><b>6</b><span>services qui n’existent pas</span><small>Boutique, CRM, tournées, commandes, kits, opérations</small></div>
    <div><b>0</b><span>donnée reliée</span><small>Un lead ne rejoint jamais sa commande</small></div>
    <div class="rouge"><b>30 à 60 k€</b><span>d’abonnements par an</span><small>Pour des outils qui ne se parlent pas</small></div>
  </div>
  <p class="punch">Résultat : des ressaisies, des opportunités perdues, une direction qui pilote à l’aveugle.</p>
  {pied(2)}
</section>''')

# 3. La solution
OUTILS = [("cloud","Dropbox"),("inbox","Enet"),("sheet","Excel"),("life-buoy","Qualios"),("ruler","MyPricer"),("mail","E-mails")]
puces = "".join(f'<div class="puce">{ic(o[0])}<b>{o[1]}</b></div>' for o in OUTILS)
fils = "".join(f'<path d="M0 {8.3+i*16.7:.1f} C 26 {8.3+i*16.7:.1f}, 22 50, 48 50"/>' for i in range(6))
S.append(f'''<section class="slide nuit">
  {sur("sparkles","La solution")}
  <h2>Six outils remplacés par <em>un seul.</em></h2>
  <div class="conv"><div class="puces">{puces}</div><svg class="fils" viewBox="0 0 48 100" preserveAspectRatio="none">{fils}</svg>
    <div class="cible">{CARRES}<b>Espace Pro</b><span>1 identifiant, 1 base de données, 22 rubriques</span></div>
    <div class="plus"><div><b>22</b><span>rubriques</span></div><div><b>5</b><span>profils</span></div><div><b>1</b><span>identifiant</span></div><div><b>0</b><span>ressaisie</span></div></div>
  </div>
  {pied(3, True)}
</section>''')

# 4. Les rubriques
FAM = [
 ("Communication et marketing", [("house","Accueil"),("folder-open","Médiathèque"),("inbox","Gestion des leads"),("megaphone","Boîte à outils local"),("party-popper","Opérations nationales"),("shopping-bag","Boutique fidélité")]),
 ("Technique et commandes", [("life-buoy","SAV"),("stethoscope","Dépannage"),("ruler","Configurateur portes"),("lock-keyhole","Commande serrures"),("key-round","Reproduction de clés")]),
 ("Outils commerciaux", [("contact","CRM"),("route","Planning des tournées"),("flag","Gestion opérations")]),
 ("Outils direction", [("telescope","Picard 2030"),("chart-line","KPI activité"),("list-checks","Paramétrage opérations"),("wrench","SAV management")]),
 ("Outils marketing", [("workflow","Lead management"),("mouse-pointer-click","Métriques &amp; Analytics"),("mail","Campagnes e-mail"),("clipboard-list","Enquêtes et sondages")]),
]
NEUF = {"Boîte à outils local","Boutique fidélité","Dépannage","Commande serrures","CRM","Planning des tournées","Gestion opérations","Picard 2030"}
fam = "".join(f'<div class="fam"><p>{t}</p>' + "".join(f'<div class="r">{tuile(i)}<b>{n}</b>{"<em>Nouveau</em>" if n in NEUF else ""}</div>' for i,n in rs) + '</div>' for t, rs in FAM)
S.append(f'''<section class="slide">
  {sur("layers","Le périmètre")}
  <h2>Tout l’écosystème Picard, <em>au même endroit.</em></h2>
  <div class="familles">{fam}</div>
  {pied(4)}
</section>''')

# 5. Ce que ça change
S.append(f'''<section class="slide">
  {sur("target","Ce que ça change")}
  <h2>Quatre leviers, <em>un seul outil.</em></h2>
  <div class="leviers">
    <div>{tuile("trending-up")}<b>Vendre plus</b><p>Chaque lead attribué en minutes et suivi jusqu’à la commande.</p><span class="tag">100 % des leads tracés</span></div>
    <div>{tuile("stethoscope")}<b>Servir mieux</b><p>Dépannage guidé avant SAV, demandes complètes, suivi transparent.</p><span class="tag">Moins de SAV, plus vite</span></div>
    <div>{tuile("piggy-bank")}<b>Dépenser moins</b><p>Abonnements arrêtés, plus de ressaisies, plus d’envois papier.</p><span class="tag">Coûts d’outils divisés par 2</span></div>
    <div>{tuile("chart-line")}<b>Piloter</b><p>Ventes, SAV, marketing et stratégie lus en temps réel.</p><span class="tag">Une seule source de vérité</span></div>
  </div>
  <p class="punch">Et un réseau qui a enfin toutes les raisons de choisir Picard, chaque jour.</p>
  {pied(5)}
</section>''')

# 6. 30 jours
SEM = [
 ("S1","Socle et accès","Comptes, droits, charte, sécurité, reprise des contacts"),
 ("S2","Vendre et servir","Leads, SAV, dépannage, médiathèque"),
 ("S3","Commander et fidéliser","Configurateur, commandes, clés, opérations, boutique"),
 ("S4","Piloter et lancer","CRM, tournées, direction, reprise de l’historique, formation"),
]
sem = "".join(f'<div class="s"><em>{s[0]}</em><b>{s[1]}</b><span>{s[2]}</span></div>' for s in SEM)
S.append(f'''<section class="slide nuit">
  {sur("zap","Rapidité d’exécution")}
  <h2>Prêt en <em>2 à 4 semaines.</em> Pas en 18 mois.</h2>
  <div class="frise30">{sem}<div class="j30">{ic("rocket")}<b>Jour 30</b><span>Tout le réseau en ligne</span></div></div>
  <div class="pourquoi">
    <div>{ic("rocket")}<b>Socle déjà construit</b><span>Un prototype fonctionne déjà.</span></div>
    <div>{ic("bot")}<b>Développement accéléré par l’IA</b><span>Des jours là où il fallait des mois.</span></div>
    <div>{ic("cloud-check")}<b>Technologies éprouvées</b><span>Rien à installer, rien à héberger soi-même.</span></div>
  </div>
  {pied(6, True)}
</section>''')

# 7. Sécurité et RGPD
SEC = [
 ("globe-lock","Hébergé en Europe","Données stockées dans l’Union européenne"),
 ("lock-keyhole","Chiffré de bout en bout","Échanges chiffrés, données chiffrées au repos"),
 ("user-round-check","Chacun ses données","Droits par rôle contrôlés au cœur de la base"),
 ("key","Accès sécurisés","Connexion par lien unique, double authentification possible"),
 ("hard-drive-download","Sauvegardé chaque jour","Restauration possible à tout moment"),
 ("activity","Tout est tracé","Journal des connexions et des actions sensibles"),
]
sec = "".join(f'<div>{tuile(s[0])}<b>{s[1]}</b><span>{s[2]}</span></div>' for s in SEC)
S.append(f'''<section class="slide">
  {sur("shield-check","Sécurité et RGPD")}
  <h2>La sécurité n’est pas une option. <em>Elle est native.</em></h2>
  <div class="secu"><div class="bouclier">{ic("shield-check")}<b>RGPD</b><span>conforme dès la conception</span></div><div class="grille-secu">{sec}</div></div>
  <div class="rgpd">
    <span>{ic("check","pi")}Données propriété de Picard</span><span>{ic("check","pi")}Collecte limitée au nécessaire</span><span>{ic("check","pi")}Droit d’accès et d’effacement</span><span>{ic("check","pi")}Registre des traitements</span><span>{ic("check","pi")}Contrats de sous-traitance conformes</span>
  </div>
  {pied(7)}
</section>''')

# 8. Maintenance
S.append(f'''<section class="slide">
  {sur("server-cog","Maintenance")}
  <h2>Toujours à jour. <em>Sans effort.</em></h2>
  <div class="maint">
    <div>{tuile("cloud-check")}<b>Zéro serveur</b><p>Hébergement géré : pas d’infrastructure à administrer.</p></div>
    <div>{tuile("refresh-cw")}<b>Mises à jour invisibles</b><p>Déployées en quelques minutes, sans coupure pour le réseau.</p></div>
    <div>{tuile("gauge")}<b>Surveillé en continu</b><p>Disponibilité, performances et alertes de sécurité suivies.</p></div>
    <div>{tuile("zap")}<b>Évolutions en jours</b><p>Une nouvelle rubrique s’ajoute au socle, sans tout refaire.</p></div>
  </div>
  <p class="punch">Un outil qui évolue au rythme de Picard, pas au rythme d’un éditeur.</p>
  {pied(8)}
</section>''')

# 9. Les chiffres
S.append(f'''<section class="slide nuit">
  {sur("coins","Les chiffres")}
  <h2>Ce que l’Espace Pro <em>rapporte.</em></h2>
  <div class="gros">
    <div><b>30</b><em>jours</em><span>pour être opérationnel</span></div>
    <div><b>−50 %</b><em>de coûts d’outils</em><span>13 à 28 k€ par an au lieu de 30 à 60 k€</span></div>
    <div><b>2 000 h</b><em>libérées par an</em><span>ressaisies, relances et recherches en moins</span></div>
    <div class="or"><b>+150 k€</b><em>de chiffre d’affaires</em><span>avec 3 points de transformation en plus sur les leads</span></div>
  </div>
  <p class="note">Ordres de grandeur, à confirmer avec les chiffres réels de Picard.</p>
  {pied(9, True)}
</section>''')

# 10. Et ensuite
S.append(f'''<section class="slide">
  {sur("rocket","Et ensuite")}
  <h2>Une plateforme qui <em>prend de la valeur.</em></h2>
  <div class="ensuite">
    <div>{tuile("smartphone")}<b>Appli iPhone et Android</b></div>
    <div>{tuile("siren")}<b>Urgences des particuliers</b></div>
    <div>{tuile("brain-circuit")}<b>Assistant technique IA</b></div>
    <div>{tuile("hand-coins")}<b>Leads facturés</b></div>
    <div>{tuile("globe")}<b>Ouverture aux distributeurs</b></div>
    <div>{tuile("chart-pie")}<b>Données au service de la gamme</b></div>
  </div>
  <p class="punch">Chaque installateur connecté rend l’outil plus utile, et Picard plus fort.</p>
  {pied(10)}
</section>''')

# 11. Décision
S.append(f'''<section class="slide nuit fin">
  {sur("gavel","Décision")}
  <h2>Un feu vert aujourd’hui.<br><em>Le réseau en ligne dans 30 jours.</em></h2>
  <div class="etapes">
    <div><em>1</em><b>Valider</b><span>le lancement</span></div>
    <div><em>2</em><b>Nommer</b><span>un référent métier</span></div>
    <div><em>3</em><b>Démarrer</b><span>lundi</span></div>
  </div>
  <div class="signature-fin">{CARRES}<b>Espace Pro</b><span>Vendre plus. Servir mieux. Dépenser moins.</span></div>
  {pied(11, True)}
</section>''')

html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Espace Pro Picard Serrures</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&display=block" rel="stylesheet"><style>{CSS}</style></head><body>{"".join(S)}</body></html>'''
open('deck.html', 'w').write(html)
print(len(S), "pages")
