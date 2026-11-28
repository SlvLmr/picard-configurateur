import json, re
I = json.load(open('icones.json'))
def ic(n, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{I[n]}</svg>'
def tuile(n): return f'<span class="tuile">{ic(n)}</span>'
def ecran(src, titre, cls=""):
    return f'<figure class="ecran {cls}"><div class="barre"><i></i><i></i><i></i><span>{titre}</span></div><img src="{src}" alt=""></figure>'
def pied(n): return f'<div class="pied"><span>{ic("layers","pi")} Espace Pro Picard Serrures</span><span>{n:02d}</span></div>'
def carte(icone, titre, texte, cls=""):
    return f'<div class="carte {cls}">{tuile(icone)}<h3>{titre}</h3><p>{texte}</p></div>'
ETIQ = {'Médiathèque': 'Remplace Dropbox', 'Gestion des leads': 'Remplace Enet', 'Opérations nationales': 'Remplace les tableurs Excel', 'SAV': 'Remplace Qualios', 'Configurateur portes': 'Remplace MyPricer', 'Reproduction de clés': 'Remplace les e-mails', 'Lead management': 'Remplace Enet', 'Boîte à outils local': 'N', 'Boutique': 'N', 'Commande serrures': 'N', 'CRM': 'N', 'Planning des tournées': 'N', 'Gestion opérations': 'N'}
def rub(icone, titre, texte):
    e = ETIQ.get(titre, "")
    et = "" if not e else (f'<em class="et neuf">{ic("circle-plus","pi")}Nouveau service</em>' if e == "N" else f'<em class="et">{ic("repeat","pi")}{e}</em>')
    return f'<div class="rub">{tuile(icone)}<div><b>{titre}</b><span>{texte}</span>{et}</div></div>'

CSS = open('style.css').read()

CARRES = '<svg class="carres" viewBox="5 23 43 43"><path fill="currentColor" d="M5.19 23.15H26.4v21.22H5.19zM32.09 23.15h15.53v15.53H32.09zM5.19 50.05h15.53v15.53H5.19zM26.4 44.36h21.21v21.22H26.4z"/></svg>'
OUTILS = [("cloud","Dropbox","Documents"),("inbox","Enet","Leads"),("sheet","Excel","Opérations"),("life-buoy","Qualios","SAV"),("ruler","MyPricer","Configurateur"),("mail","E-mails","Clés")]
_puces = "".join(f'<div class="puce">{ic(o[0])}<b>{o[1]}</b><small>{o[2]}</small></div>' for o in OUTILS)
_fils = "".join(f'<path d="M0 {8.3+i*16.7:.1f} C 26 {8.3+i*16.7:.1f}, 22 50, 48 50"/>' for i in range(6))
CONV = f'''<div class="convergence"><div class="puces">{_puces}</div><svg class="fils" viewBox="0 0 48 100" preserveAspectRatio="none">{_fils}</svg><div class="cible">{CARRES}<b>Espace Pro</b><span>Un identifiant, une base de données, tout le réseau.</span><em class="mini">{ic("smartphone","pi")}Appli iPhone et Android</em></div></div>'''

AVANT = [
 ("folder-open","Médiathèque","outil","cloud","Dropbox"),
 ("inbox","Gestion des leads","outil","app-window","Enet"),
 ("megaphone","Boîte à outils local","rien","",""),
 ("party-popper","Opérations nationales","outil","sheet","Tableurs Excel"),
 ("shopping-bag","Boutique","rien","",""),
 ("life-buoy","SAV","outil","app-window","Qualios"),
 ("ruler","Configurateur portes","outil","app-window","MyPricer"),
 ("lock-keyhole","Commande serrures","rien","",""),
 ("key-round","Reproduction de clés","outil","mail","E-mails"),
 ("contact","CRM","rien","",""),
 ("route","Planning des tournées","rien","",""),
 ("flag","Gestion opérations","rien","",""),
]
def _ligne(r):
    av = f'<span class="av outil">{ic(r[3])}{r[4]}</span>' if r[2]=="outil" else f'<span class="av rien">{ic("circle-off")}N’existe pas</span>'
    return f'<div class="nom">{tuile(r[0])}<b>{r[1]}</b></div>{av}<span class="fl">{ic("arrow-right")}</span>'
STORES = f'<span class="store">{ic("smartphone")}<span><small>Télécharger sur</small>App Store</span></span><span class="store">{ic("smartphone")}<span><small>Disponible sur</small>Google Play</span></span><span class="store">{ic("monitor")}<span><small>Accès</small>Navigateur web</span></span>'
AA_LIGNES = "".join(_ligne(r) for r in AVANT)
pages = []

pages.append(f'''<section class="page couverture">
  <img class="logo" src="logo-blanc.svg" alt="Picard Serrures">
  <div class="signature"><span></span>ESPACE PRO<span></span></div>
  <h1>Tout l’écosystème Picard,<br><em>dans une seule plateforme.</em></h1>
  <p class="accroche">Leads, configurateur, SAV, commandes, documentation, opérations, fidélité et pilotage : l’Espace Pro réunit tout le réseau Picard Serrures autour d’un outil unique, pensé pour vendre plus, servir mieux et dépenser moins.</p>
  <div class="stores couv">{STORES}</div>
  {CONV}
  <div class="trois">
    <div>{ic("trending-up")}<b>Développer les ventes</b><small>Chaque demande devient une opportunité suivie jusqu’à la commande.</small></div>
    <div>{ic("star")}<b>Fidéliser le réseau</b><small>Toutes les raisons de choisir Picard, chaque jour.</small></div>
    <div>{ic("coins")}<b>Optimiser les ressources</b><small>Moins de saisies, d’envois et d’outils.</small></div>
  </div>
</section>''')

pages.append(f'''<section class="page">
  <p class="sur">{ic("repeat","si")} Avant, après</p>
  <h2>Aujourd’hui, des outils éparpillés.<br>Demain, un seul Espace Pro.</h2>
  <p class="intro">Documents, leads, SAV, configurateur, opérations : chaque sujet vit dans son outil, son tableur ou sa boîte mail, et la moitié des services n’existent pas encore. L’Espace Pro les réunit tous.</p>
  <div class="aa mt">
    <div class="tete"><span>Rubrique</span><span>Avant</span><span></span><span class="apres">Après</span></div>
    <div class="grille">{AA_LIGNES}
      <div class="bloc">{CARRES}<b>Espace Pro</b><ul>
        <li>{ic("check")}Un seul identifiant</li><li>{ic("check")}Une seule base de données</li><li>{ic("check")}L’historique repris</li><li>{ic("check")}Des données reliées entre elles</li><li>{ic("check")}Appli sur l’App Store et Google Play</li></ul>
        <small>Et aussi : Picard 2030, KPI activité, paramétrage des opérations, SAV management, Lead management, Métriques &amp; Analytics, campagnes e-mail, enquêtes.</small></div>
    </div>
  </div>
  <div class="gains mt">
    <div><b>6</b><span>outils et canaux dispersés remplacés</span></div>
    <div><b>6</b><span>services créés pour le réseau</span></div>
    <div class="fort"><b>30 à 60 k€</b><span>économisés en abandonnant des outils</span></div>
    <div><b>{ic("rotate-ccw-clock")}</b><span>tout l’historique récupéré</span></div>
  </div>
  <p class="citation">Moins d’outils, moins d’abonnements, moins de ressaisies : et pour la première fois, une vision complète du réseau.</p>
  {pied(2)}
</section>''')

pages.append(f'''<section class="page">
  <p class="sur">{ic("target","si")} Pourquoi l’Espace Pro</p>
  <h2>Un réseau plus fort quand tout le monde travaille au même endroit</h2>
  <p class="intro">Aujourd’hui, l’information circule par e-mails, tableurs, appels et documents éparpillés. Chaque relais coûte du temps, fait perdre des opportunités et brouille l’image de marque. L’Espace Pro remplace cette dispersion par une expérience unique, cohérente et mesurable.</p>
  <div class="g2 mt">
    {carte("zap","Réactivité commerciale","Les demandes arrivent qualifiées, au bon installateur, avec un délai de réponse encadré et des relances automatiques. Plus aucun lead ne dort dans une boîte mail.")}
    {carte("clock","Du temps gagné pour tous","Un seul identifiant, un seul outil : équipes et clients trouvent en quelques secondes ce qu’ils cherchaient hier dans cinq outils différents.")}
    {carte("repeat","Une fidélisation durable","Points, boutique, opérations nationales, parrainage, enquêtes : l’installateur vit la marque au quotidien et a de vraies raisons de rester.")}
    {carte("chart-column","Un pilotage par la donnée","Chaque action laisse une trace : la direction suit l’activité, la transformation et le retour sur investissement en temps réel.")}
  </div>
  <div class="chiffres mt">
    <div>{ic("store")}<b>Le réseau</b><span>Des leads, des outils de vente, une documentation à jour et un service réactif.</span></div>
    <div>{ic("users")}<b>Les équipes</b><span>Moins de tâches répétitives, des priorités claires, une vision complète du client.</span></div>
    <div>{ic("briefcase")}<b>La direction</b><span>Des indicateurs fiables, des coûts maîtrisés, une stratégie déployée jusqu’au terrain.</span></div>
  </div>
  <p class="citation">Un outil unique pour le réseau, une expérience premium pour les installateurs, une maîtrise totale pour Picard.</p>
  {pied(3)}
</section>''')

etapes = [
 ("file-input","La demande arrive","Formulaire du site, configurateur, appel : chaque demande entre dans l’Espace Pro, complète et horodatée.","Lead management"),
 ("user-check","Elle est qualifiée et orientée","Le Lead Manager évalue la température du projet et l’attribue au bon installateur du secteur grâce au zoning.","Lead management, Zoning"),
 ("bell-ring","L’installateur accepte en un clic","E-mail et SMS immédiats, compte à rebours visible, coordonnées du client débloquées à l’acceptation.","Gestion des leads"),
 ("calculator","Il conseille, configure et chiffre","Configurateur, médiathèque et argumentaires pour convaincre et produire un devis juste, rapidement.","Configurateur portes, Médiathèque"),
 ("receipt","La commande est passée et rapprochée","La commande est rattachée au lead : la transformation réelle et le chiffre d’affaires par canal sont mesurés.","Commandes Navision, Commande serrures"),
 ("camera","La pose et le service après-vente","Déclaration SAV en quelques minutes, photos à l’appui, suivi transparent jusqu’à la résolution.","SAV, SAV management"),
 ("star","La satisfaction est mesurée","Enquêtes automatiques auprès du client et de l’installateur : chaque retour devient un levier de progrès.","Enquêtes et sondages"),
 ("gift","La fidélité est récompensée","Points, boutique, opérations nationales et parrainage : plus l’installateur travaille avec Picard, plus il y gagne.","Boutique, Opérations nationales"),
]
etapes_html = "".join(f'<div class="etape"><div class="rond">{ic(e[0])}<em>{i+1}</em></div><div><h3>{e[1]}</h3><p>{e[2]}</p><span class="ou">{ic("layers","pi")} {e[3]}</span></div></div>' for i,e in enumerate(etapes))
pages.append(f'''<section class="page">
  <p class="sur">{ic("route","si")} Le parcours client de bout en bout</p>
  <h2>De la demande du particulier à la fidélité de l’installateur</h2>
  <p class="intro">Chaque étape est accompagnée, chaque acteur est relié : client final, installateur, commercial, Lead Manager, SAV et direction.</p>
  <div class="parcours mt">{etapes_html}</div>
  {pied(4)}
</section>''')


pages.append(f'''<section class="page">
  <p class="sur">{ic("users","si")} Une plateforme, cinq expériences</p>
  <h2>Chacun voit exactement ce dont il a besoin</h2>
  <p class="intro">L’Espace Pro s’adapte au rôle de chaque utilisateur : ses rubriques, son accueil, ses priorités. L’administrateur peut voir la plateforme avec les yeux de n’importe quel profil.</p>
  <div class="g2 mt">
    <div class="carte nuit">{tuile("store")}<h3>Installateurs et réseau IAP</h3><ul>
      <li>Leads qualifiés du secteur, notifiés par e-mail et SMS</li><li>Un accueil qui affiche les priorités du jour</li>
      <li>Configurateur, documentation, kits de communication locale</li><li>SAV, commandes et reproductions de clés au même endroit</li>
      <li>Points, boutique et opérations pour être récompensés</li></ul></div>
    <div class="carte">{tuile("briefcase")}<h3>Commerciaux (ATC)</h3><ul>
      <li>Une vision complète de chaque client : activité, leads, SAV</li><li>CRM et planning des tournées</li>
      <li>Gestion des opérations sur leur secteur</li><li>Des sujets de visite concrets à chaque rendez-vous</li></ul></div>
    <div class="carte">{tuile("workflow")}<h3>Lead Manager et marketing</h3><ul>
      <li>Qualification, attribution, carte et zoning des leads</li><li>Campagnes e-mail, enquêtes, Métriques &amp; Analytics</li>
      <li>Opérations nationales et parrainage en quelques clics</li><li>Statistiques de transformation et de satisfaction</li></ul></div>
    <div class="carte">{tuile("life-buoy")}<h3>SAV et qualité</h3><ul>
      <li>Des demandes complètes dès le départ, photos comprises</li><li>Une file de traitement claire et des échanges tracés</li>
      <li>Le pilotage des délais, des défauts et des coûts</li></ul></div>
    <div class="carte or large">{tuile("telescope")}<h3>Direction</h3><ul class="col2">
      <li>Les KPI de l’activité en temps réel</li><li>Le plan stratégique Picard 2030 partagé et suivi</li>
      <li>Le paramétrage des opérations commerciales</li><li>La maîtrise complète des droits et des contenus</li></ul></div>
  </div>
  {pied(5)}
</section>''')

pages.append(f'''<section class="page">
  <p class="sur">{ic("layers","si")} Les rubriques</p>
  <h2>Un écosystème complet, au service de tout le réseau</h2>
  <p class="famille">Communication et marketing</p>
  <div class="rubs">
    {rub("house","Accueil","Priorités du jour, canal de messages officiel avec photos, agenda du réseau en frise interactive.")}
    {rub("folder-open","Médiathèque","Catalogues, notices, vidéos et photos par gamme et par produit, avec aperçu instantané.")}
    {rub("inbox","Gestion des leads","Les demandes de devis du secteur, acceptées dans le délai puis suivies jusqu’à la pose.")}
    {rub("megaphone","Boîte à outils local","Kits et supports pour animer sa communication locale aux couleurs de Picard.")}
    {rub("party-popper","Opérations nationales","Offres, remboursements et parrainage, avec participation et suivi des dossiers en ligne.")}
    {rub("shopping-bag","Boutique","Les points de fidélité convertis en récompenses, avec validation et suivi des commandes.")}
  </div>
  <p class="famille">Technique et commandes</p>
  <div class="rubs">
    {rub("life-buoy","SAV","Déclaration guidée, pièces jointes, échanges et suivi en temps réel de chaque demande.")}
    {rub("ruler","Configurateur portes","Configurer une porte en quelques minutes et obtenir un chiffrage fiable.")}
    {rub("lock-keyhole","Commande serrures","Serrures, cylindres et pièces aux conditions du client, livraisons et factures, recommande en un clic.")}
    {rub("key-round","Reproduction de clés","Demandes de clés protégées dématérialisées, justificatifs joints, suivi jusqu’à l’expédition.")}
  </div>
  <div class="bandeau mt">
    <div>{ic("search")}<b>Tout trouver</b><small>Documents, offres et informations à jour, au même endroit.</small></div>
    <div>{ic("shopping-bag")}<b>Tout commander</b><small>Serrures, clés et récompenses sans e-mail ni bon papier.</small></div>
    <div>{ic("eye")}<b>Tout suivre</b><small>Leads, SAV et dossiers visibles en temps réel.</small></div>
  </div>
  {pied(6)}
</section>''')

pages.append(f'''<section class="page">
  <p class="sur">{ic("layers","si")} Les rubriques</p>
  <h2>Des outils pour vendre, piloter et animer</h2>
  <p class="famille">Outils commerciaux</p>
  <div class="rubs">
    {rub("contact","CRM","Fiche client complète, actions, contacts et historique partagés par toute l’équipe.")}
    {rub("route","Planning des tournées","Préparer et optimiser ses visites, ne rien oublier sur le terrain.")}
    {rub("flag","Gestion opérations","Déployer les opérations chez ses clients, suivre la participation et les résultats.")}
  </div>
  <p class="famille">Outils direction</p>
  <div class="rubs">
    {rub("telescope","Picard 2030","Le plan stratégique : ambitions, chantiers, responsables et indicateurs partagés.")}
    {rub("chart-line","KPI activité","Ventes, activité et performance par secteur, client et période.")}
    {rub("list-checks","Paramétrage opérations","Concevoir les opérations commerciales et suivre leur avancement sur le terrain.")}
    {rub("wrench","SAV management","Délais, défauts récurrents, charge des intervenants, satisfaction et coût du SAV.")}
  </div>
  <p class="famille">Outils marketing</p>
  <div class="rubs">
    {rub("workflow","Lead management","Validation, qualification, attribution, carte, zoning, envois et rapprochement avec les commandes.")}
    {rub("mouse-pointer-click","Métriques &amp; Analytics","Google Ads, fréquentation du site, référencement naturel et présence dans les moteurs d’IA.")}
    {rub("mail","Campagnes e-mail","Newsletters composées par blocs, aperçu fidèle, envoi ciblé par public.")}
    {rub("clipboard-list","Enquêtes et sondages","Questionnaires ciblés, réponses dans l’espace, résultats et score de recommandation.")}
  </div>
  <div class="bandeau mt">
    <div>{ic("contact")}<b>Le terrain outillé</b><small>CRM, tournées et opérations enfin dans un vrai outil.</small></div>
    <div>{ic("telescope")}<b>La direction éclairée</b><small>Stratégie, KPI et SAV pilotés depuis la même base.</small></div>
    <div>{ic("megaphone")}<b>Le marketing mesuré</b><small>Leads, trafic, campagnes et enquêtes reliés aux ventes.</small></div>
  </div>
  {pied(7)}
</section>''')


pages.append(f'''<section class="page">
  <p class="sur">{ic("coins","si")} Optimisation des coûts et des ressources</p>
  <h2>Faire plus avec les mêmes équipes</h2>
  <p class="intro">L’Espace Pro automatise ce qui coûte du temps sans créer de valeur, et concentre les équipes sur ce qui fait vendre : le conseil, la relation et le terrain.</p>
  <div class="g2 mt">
    {carte("refresh-cw","Moins de ressaisies","Une information saisie une fois est partagée par tous : lead, client, commande et SAV sont reliés. Fini les doubles saisies.")}
    {carte("headphones","Moins d’appels et d’e-mails","Statuts en ligne, notifications automatiques, échanges SAV centralisés : les relances et les échanges dispersés disparaissent.")}
    {carte("printer-check","Moins d’impression et d’envois","Catalogues, notices et kits sont en ligne et toujours à jour. Plus de documents obsolètes ni d’envois postaux.")}
    {carte("piggy-bank","30 à 60 k€ d’outils en moins","Les abonnements aux outils abandonnés financent l’Espace Pro, et tout l’historique est repris : rien n’est perdu.")}
    {carte("wallet","Un budget marketing piloté","Chaque lead est suivi jusqu’à la commande : on investit là où le retour est prouvé, et la facturation des leads est paramétrable.")}
    {carte("target","Des équipes recentrées","Lead Manager, commerciaux et SAV disposent de files de travail claires et priorisées : plus d’impact par personne.")}
  </div>
  <div class="bandeau mt">
    <div>{ic("chart-column")}<b>Mesurer</b><small>Transformation, délais, satisfaction, chiffre d’affaires rapproché.</small></div>
    <div>{ic("target")}<b>Décider</b><small>Des indicateurs fiables pour arbitrer budgets et priorités.</small></div>
    <div>{ic("trending-up")}<b>Améliorer</b><small>Chaque retour alimente un cycle d’amélioration continue.</small></div>
  </div>
  {pied(8)}
</section>''')

pages.append(f'''<section class="page">
  <p class="sur">{ic("star","si")} Fidélisation et expérience</p>
  <h2>Donner au réseau toutes les raisons de choisir Picard</h2>
  <p class="intro">Un installateur fidèle est un installateur bien équipé, bien informé, bien servi et récompensé. L’Espace Pro réunit ces quatre leviers dans une expérience premium, à l’image de la marque.</p>
  <div class="g2 mt">
    {carte("ruler","Bien équipé","Configurateur, documentation, kits de communication locale et commande en ligne : tout pour vendre Picard plus facilement.","nuit")}
    {carte("megaphone","Bien informé","Canal officiel, agenda des salons et formations, nouveautés produits : le réseau vit au rythme de la marque.","nuit")}
    {carte("shield-check","Bien servi","Leads qualifiés, SAV réactif et transparent, clés simplifiées : un service qui fait gagner du temps et de la crédibilité.","nuit")}
    {carte("gift","Récompensé","Points, boutique, opérations nationales, remboursements et parrainage : la fidélité devient concrète.","nuit")}
  </div>
  <div class="g3 mt">
    {carte("badge-check","Niveaux IAP valorisés","Elite, Premium et Officiel bénéficient d’avantages et de contenus adaptés.","or")}
    {carte("sparkles","Écoute permanente","Enquêtes et score de recommandation : la voix du réseau pilote les améliorations.","or")}
    {carte("leaf","Image de marque","Une expérience moderne et soignée qui positionne Picard en référence.","or")}
  </div>
  <p class="citation">Plus l’installateur utilise l’Espace Pro, plus il vend Picard, et plus il est récompensé : un cercle vertueux.</p>
  {pied(9)}
</section>''')

pages.append(f'''<section class="page final">
  <div class="final-g">
    <div>
      <p class="sur">{ic("shield-check","si")} Une base solide</p>
      <h2>Moderne, sûr et disponible partout</h2>
      <p class="intro">Construit sur des technologies actuelles et évolutives, avec une exigence de sécurité et de simplicité à chaque écran.</p>
      <div class="liste-f mt">
        <div>{tuile("shield-check")}<div><b>Sécurité par rôle</b><span>Chacun ne voit que ses données ; les droits sont contrôlés par la base et seul l’administrateur paramètre.</span></div></div>
        <div>{tuile("smartphone")}<div><b>Une vraie application mobile</b><span>Sur l’App Store et Google Play pour iPhone et Android, et sur ordinateur depuis le navigateur. Notifications push, photos et accès hors connexion.</span></div></div>
        <div>{tuile("map-pinned")}<div><b>Pensé pour le terrain</b><span>Notifications instantanées, photos de chantier, consultation en déplacement.</span></div></div>
        <div>{tuile("layers")}<div><b>Évolutif sans rupture</b><span>Chaque nouvelle rubrique s’ajoute au même socle, sans changer d’outil.</span></div></div>
      </div>
    </div>
  </div>
  <div class="chiffres-f"><div><b>21</b><span>rubriques</span></div><div><b>5</b><span>profils utilisateurs</span></div><div><b>1</b><span>seul identifiant</span></div><div><b>0</b><span>double saisie</span></div></div>
  <div class="stores mt">{STORES}</div>
  <div class="conclusion">{CARRES}<p>Demain, tout le réseau Picard<br><em>dans un seul outil.</em></p><small>Développer les ventes, fidéliser le réseau, piloter chaque euro.</small></div>
  {pied(10)}
</section>''')

html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Espace Pro Picard Serrures</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&display=block" rel="stylesheet"><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'''
open('presentation.html','w').write(html)
print(len(html))
