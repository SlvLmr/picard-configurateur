"""Dossier de décision Espace Pro, pour la direction et les actionnaires.
Le projet est présenté comme à lancer : faisable, phasé, chiffré, avec ses gains et ses risques."""
import json

I = json.load(open('icones.json'))
def ic(n, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{I[n]}</svg>'
def tuile(n): return f'<span class="tuile">{ic(n)}</span>'
def pied(n): return f'<div class="pied"><span>{ic("layers","pi")} Espace Pro Picard Serrures, dossier de décision</span><span>{n:02d}</span></div>'
def carte(icone, titre, texte, cls=""):
    return f'<div class="carte {cls}">{tuile(icone)}<h3>{titre}</h3><p>{texte}</p></div>'
def entete(icone, sur, titre, intro=None):
    return f'<p class="sur">{ic(icone,"si")} {sur}</p><h2>{titre}</h2>' + (f'<p class="intro">{intro}</p>' if intro else '')

CSS = open('style.css').read() + open('style-decision.css').read()
CARRES = '<svg class="carres" viewBox="5 23 43 43"><path fill="currentColor" d="M5.19 23.15H26.4v21.22H5.19zM32.09 23.15h15.53v15.53H32.09zM5.19 50.05h15.53v15.53H5.19zM26.4 44.36h21.21v21.22H26.4z"/></svg>'
pages = []

# ───────── 1. Couverture ─────────
OUTILS = [("cloud","Dropbox","Documents"),("inbox","Enet","Leads"),("sheet","Excel","Opérations"),("life-buoy","Qualios","SAV"),("ruler","MyPricer","Configurateur"),("mail","E-mails","Clés")]
puces = "".join(f'<div class="puce">{ic(o[0])}<b>{o[1]}</b><small>{o[2]}</small></div>' for o in OUTILS)
fils = "".join(f'<path d="M0 {8.3+i*16.7:.1f} C 26 {8.3+i*16.7:.1f}, 22 50, 48 50"/>' for i in range(6))
pages.append(f'''<section class="page couverture">
  <img class="logo" src="logo-blanc.svg" alt="Picard Serrures">
  <div class="signature"><span></span>ESPACE PRO<span></span></div>
  <p class="etiquette">Dossier de décision, direction et actionnaires</p>
  <h1>Un seul outil<br><em>pour tout le réseau Picard.</em></h1>
  <p class="accroche">Le projet Espace Pro propose de réunir leads, SAV, configurateur, commandes, documentation, opérations, fidélité et pilotage dans une plateforme unique, construite par étapes en douze mois, financée en grande partie par les outils qu’elle remplace.</p>
  <div class="convergence"><div class="puces">{puces}</div><svg class="fils" viewBox="0 0 48 100" preserveAspectRatio="none">{fils}</svg><div class="cible">{CARRES}<b>Espace Pro</b><span>Une plateforme, une base de données, tout le réseau.</span><em class="mini">{ic("calendar-range","pi")}Déploiement en 12 mois</em></div></div>
  <div class="trois">
    <div>{ic("trending-up")}<b>Vendre plus</b><small>Chaque demande suivie jusqu’à la commande.</small></div>
    <div>{ic("piggy-bank")}<b>Dépenser moins</b><small>Six outils et canaux remplacés par un seul.</small></div>
    <div>{ic("star")}<b>Fidéliser le réseau</b><small>Une expérience à la hauteur de la marque.</small></div>
  </div>
</section>''')

# ───────── 2. Synthèse ─────────
pages.append(f'''<section class="page">
  {entete("file-check","Synthèse pour décision","Le projet en une page")}
  <div class="synthese mt">
    <div class="bloc-s"><b>{ic("triangle-exclamation-point","pi")} Le constat</b><p>Les outils du réseau sont dispersés : documents sur Dropbox, leads sur Enet, SAV sur Qualios, configurateur sur MyPricer, opérations sur tableurs, clés par e-mail. Six services attendus n’existent pas. L’information est ressaisie, rien n’est relié, la direction ne voit pas l’ensemble.</p></div>
    <div class="bloc-s"><b>{ic("lightbulb","pi")} La proposition</b><p>Construire l’Espace Pro : une plateforme unique, au nom et aux couleurs de Picard, pour les installateurs, les commerciaux, le SAV, le marketing et la direction. Vingt-deux rubriques, déployées en quatre phases, puis une application iPhone et Android.</p></div>
    <div class="bloc-s"><b>{ic("circle-check-big","pi")} Pourquoi c’est faisable</b><p>Un prototype fonctionnel est déjà en ligne : accueil, leads, médiathèque, opérations, campagnes, enquêtes. Les technologies sont standard et hébergées en Europe. Chaque phase livre un résultat utilisable et arrête un abonnement.</p></div>
  </div>
  <div class="kpis mt">
    <div><b>12 mois</b><span>pour le déploiement complet, en 4 phases</span></div>
    <div><b>6</b><span>outils et canaux remplacés</span></div>
    <div><b>6</b><span>services nouveaux pour le réseau</span></div>
    <div class="fort"><b>30 à 60 k€</b><span>d’abonnements arrêtés</span></div>
  </div>
  <div class="bref mt">
    <div class="b1"><em>M1 à M3</em><b>Fondations</b><span>Leads, SAV, dépannage, médiathèque</span></div>
    <div class="b2"><em>M4 à M6</em><b>Vendre et fidéliser</b><span>Configurateur, opérations, boutique, clés</span></div>
    <div class="b3"><em>M7 à M9</em><b>Terrain et direction</b><span>CRM, tournées, commandes, Picard 2030</span></div>
    <div class="b4"><em>M10 à M12</em><b>Mobilité et urgence</b><span>Appli iPhone et Android, urgences</span></div>
  </div>
  <div class="decision mt"><b>{ic("gavel","pi")} Décision attendue</b><p>Valider le lancement de la phase 1 (trois mois), son budget et la nomination d’un chef de projet métier. Les phases suivantes sont engagées une à une, sur la base des résultats mesurés.</p></div>
  {pied(2)}
</section>''')

# ───────── 3. Aujourd'hui, demain ─────────
AVANT = [
 ("folder-open","Médiathèque","outil","cloud","Dropbox"),
 ("inbox","Gestion des leads","outil","app-window","Enet"),
 ("megaphone","Boîte à outils local","rien","",""),
 ("party-popper","Opérations nationales","outil","sheet","Tableurs Excel"),
 ("shopping-bag","Boutique fidélité","rien","",""),
 ("life-buoy","SAV","outil","app-window","Qualios"),
 ("ruler","Configurateur portes","outil","app-window","MyPricer"),
 ("lock-keyhole","Commande serrures","rien","",""),
 ("key-round","Reproduction de clés","outil","mail","E-mails"),
 ("contact","CRM","rien","",""),
 ("route","Planning des tournées","rien","",""),
 ("flag","Gestion opérations","rien","",""),
]
def ligne(r):
    av = f'<span class="av outil">{ic(r[3])}{r[4]}</span>' if r[2]=="outil" else f'<span class="av rien">{ic("circle-off")}N’existe pas</span>'
    return f'<div class="nom">{tuile(r[0])}<b>{r[1]}</b></div>{av}<span class="fl">{ic("arrow-right")}</span>'
pages.append(f'''<section class="page">
  {entete("repeat","Aujourd’hui, demain","Des outils éparpillés aujourd’hui.<br>Un seul Espace Pro demain.","Chaque sujet vit dans son outil, son tableur ou sa boîte mail, et la moitié des services attendus par le réseau n’existent pas. Le projet les réunit tous.")}
  <div class="aa mt">
    <div class="tete"><span>Rubrique</span><span>Aujourd’hui</span><span></span><span class="apres">Avec l’Espace Pro</span></div>
    <div class="grille">{"".join(ligne(r) for r in AVANT)}
      <div class="bloc">{CARRES}<b>Espace Pro</b><ul>
        <li>{ic("check")}Un seul identifiant</li><li>{ic("check")}Une seule base de données</li><li>{ic("check")}L’historique repris</li><li>{ic("check")}Des données reliées entre elles</li><li>{ic("check")}Une appli iPhone et Android</li></ul>
        <small>Et aussi : Dépannage, Picard 2030, KPI activité, paramétrage des opérations, SAV management, Lead management, Métriques &amp; Analytics, campagnes e-mail, enquêtes.</small></div>
    </div>
  </div>
  <p class="citation">Moins d’outils, moins d’abonnements, moins de ressaisies, et pour la première fois une vision complète du réseau.</p>
  {pied(3)}
</section>''')

# ───────── 4. Enjeux ─────────
pages.append(f'''<section class="page">
  {entete("target","Pourquoi maintenant","Le coût de l’inaction augmente chaque année","Le réseau attend des outils modernes, la concurrence digitalise sa relation installateur, et chaque nouvel outil ajouté séparément rend l’ensemble plus coûteux et plus difficile à piloter.")}
  <div class="g2 mt">
    <div class="carte risque">{tuile("triangle-exclamation-point")}<h3>Si rien ne change</h3><ul>
      <li>Des abonnements qui s’additionnent, sans vision d’ensemble des coûts</li>
      <li>Des leads sans suivi jusqu’à la commande : le retour du marketing reste invisible</li>
      <li>Un SAV traité hors du parcours client, avec des demandes incomplètes</li>
      <li>Des données dispersées, des départs de collaborateurs qui emportent l’historique</li>
      <li>Une expérience installateur en retrait de l’image premium de la marque</li></ul></div>
    <div class="carte nuit">{tuile("rocket")}<h3>Avec l’Espace Pro</h3><ul>
      <li>Un coût d’outillage réduit à environ 1 k€ par an</li>
      <li>Chaque lead suivi jusqu’au chiffre d’affaires, par canal et par secteur</li>
      <li>Un SAV plus rapide, et moins de demandes grâce au dépannage guidé</li>
      <li>Une donnée unique, propriété de Picard, exploitable pour décider</li>
      <li>Un réseau mieux équipé, mieux informé, plus fidèle</li></ul></div>
  </div>
  <div class="chiffres mt">
    <div>{ic("store")}<b>Pour le réseau</b><span>Un seul accès pour vendre, commander, se faire aider et être récompensé.</span></div>
    <div>{ic("users")}<b>Pour les équipes</b><span>Moins de tâches répétitives, des files de travail claires, une vision client complète.</span></div>
    <div>{ic("briefcase")}<b>Pour la direction</b><span>Des indicateurs fiables, des coûts maîtrisés, une stratégie suivie jusqu’au terrain.</span></div>
  </div>
  <div class="bandeau mt">
    <div>{ic("circle-off")}<b>Pas un « big bang »</b><small>Une bascule rubrique par rubrique, les anciens outils restent actifs jusqu’au relais.</small></div>
    <div>{ic("circle-off")}<b>Pas un logiciel de plus</b><small>Chaque mise en service retire un outil, un tableur ou un circuit d’e-mails.</small></div>
    <div>{ic("circle-off")}<b>Pas une dépendance</b><small>Code et données appartiennent à Picard, sur des technologies standard.</small></div>
  </div>
  {pied(4)}
</section>''')

# ───────── 5 et 6. Rubrique par rubrique ─────────
def rang(icone, nom, apport, pour, remplace, effort, phase):
    pts = "".join(f'<i class="{"on" if k < effort else ""}"></i>' for k in range(3))
    rem = f'<span class="rem neuf">Nouveau</span>' if remplace == "N" else (f'<span class="rem">{remplace}</span>' if remplace else '<span class="rem vide">Centralisé</span>')
    return f'<tr><td><div class="rn">{tuile(icone)}<b>{nom}</b></div></td><td>{apport}</td><td>{pour}</td><td>{rem}</td><td><span class="effort">{pts}</span></td><td><span class="ph p{phase}">P{phase}</span></td></tr>'
def tableau(groupes):
    corps = ""
    for titre, lignes in groupes:
        corps += f'<tr class="grp"><td colspan="6">{titre}</td></tr>' + "".join(rang(*l) for l in lignes)
    return f'<table class="rubt"><thead><tr><th>Rubrique</th><th>Ce que ça apporte</th><th>Pour qui</th><th>Remplace</th><th>Effort</th><th>Phase</th></tr></thead><tbody>{corps}</tbody></table>'
G1 = [
 ("Communication et marketing", [
  ("house","Accueil personnalisé","Priorités du jour, messages officiels, agenda du réseau, nouveautés à traiter","Tous","",1,1),
  ("folder-open","Médiathèque","Catalogues, notices, vidéos toujours à jour, aperçu instantané","Réseau, commerciaux","Dropbox",1,1),
  ("inbox","Gestion des leads","Attribution au bon installateur, délai d’acceptation, suivi jusqu’à la commande","Réseau, marketing","Enet",2,1),
  ("megaphone","Boîte à outils local","Kits de communication aux couleurs de Picard, personnalisables","Réseau","N",2,3),
  ("party-popper","Opérations nationales","Participation, remboursements et parrainage gérés en ligne","Réseau, marketing","Excel",2,2),
  ("shopping-bag","Boutique fidélité","Points convertis en récompenses, validation et suivi","Réseau","N",2,2)]),
 ("Technique et commandes", [
  ("life-buoy","SAV","Déclaration guidée avec photos, file de traitement, suivi transparent","Réseau, SAV","Qualios",3,1),
  ("stethoscope","Dépannage","Diagnostic guidé avant SAV, puis urgences des particuliers","Réseau, particuliers","N",2,1),
  ("ruler","Configurateur portes","Chiffrage fiable en quelques minutes, relié au lead et à la commande","Réseau","MyPricer",3,2),
  ("lock-keyhole","Commande serrures","Commande aux conditions du client, livraisons, factures","Réseau, ADV","N",3,3),
  ("key-round","Reproduction de clés","Demande dématérialisée, justificatifs, suivi jusqu’à l’expédition","Réseau, atelier","E-mails",1,2)]),
]
G2 = [
 ("Outils commerciaux", [
  ("contact","CRM","Fiche client complète : activité, leads, SAV, actions de l’équipe","Commerciaux","N",2,3),
  ("route","Planning des tournées","Visites préparées et optimisées, sujets de rendez-vous","Commerciaux","N",2,3),
  ("flag","Gestion opérations","Déploiement des opérations chez chaque client, suivi des résultats","Commerciaux","N",2,3)]),
 ("Outils direction", [
  ("telescope","Picard 2030","Plan stratégique partagé : chantiers, responsables, indicateurs","CODIR","N",1,3),
  ("chart-line","KPI activité","Ventes, activité et performance par secteur et par client","Direction","",2,3),
  ("list-checks","Paramétrage opérations","Conception et suivi des opérations commerciales","Direction, marketing","",1,2),
  ("wrench","SAV management","Délais, défauts récurrents, coût et satisfaction du SAV","Qualité, direction","",2,2)]),
 ("Outils marketing", [
  ("workflow","Lead management","Qualification, zoning, attribution, rapprochement avec les commandes","Marketing","Enet",2,1),
  ("mouse-pointer-click","Métriques &amp; Analytics","Google Ads, trafic du site, référencement, en un tableau","Marketing","",2,3),
  ("mail","Campagnes e-mail","Newsletters ciblées par public, aperçu fidèle","Marketing","",1,2),
  ("clipboard-list","Enquêtes et sondages","Satisfaction et score de recommandation du réseau","Marketing","",1,2)]),
]
legende = f'<p class="legende-t"><span class="effort"><i class="on"></i><i></i><i></i></span> faible <span class="effort"><i class="on"></i><i class="on"></i><i></i></span> moyen <span class="effort"><i class="on"></i><i class="on"></i><i class="on"></i></span> élevé <span class="sep"></span><span class="ph p1">P1</span> à <span class="ph p4">P4</span> phase de déploiement, voir la feuille de route</p>'
pages.append(f'''<section class="page">
  {entete("layers","Rubrique par rubrique","Ce que chaque rubrique apportera")}
  {tableau(G1)}
  {legende}
  {pied(5)}
</section>''')
pages.append(f'''<section class="page">
  {entete("layers","Rubrique par rubrique","Des outils pour vendre, piloter et animer")}
  {tableau(G2)}
  {legende}
  {pied(6)}
</section>''')

# ───────── 7. Dépannage ─────────
pages.append(f'''<section class="page">
  {entete("stethoscope","Une rubrique nouvelle","Dépannage : moins de SAV, plus de service","Une rubrique pensée pour résoudre les problèmes avant qu’ils ne deviennent des demandes SAV, puis pour capter les urgences des particuliers au profit du réseau.")}
  <div class="g2 mt">
    <div class="carte">{tuile("lightbulb")}<h3>Volet 1 : diagnostic guidé, pour l’installateur</h3><ul>
      <li>Produit, symptôme, causes probables, solution pas à pas</li>
      <li>Vidéos, photos et fiches de réglage du bureau d’études</li>
      <li>Si le problème persiste, une demande SAV créée automatiquement, déjà qualifiée</li></ul>
      <p class="gain">{ic("trending-up","pi")} Moins de demandes SAV simples, des demandes mieux renseignées</p></div>
    <div class="carte">{tuile("siren")}<h3>Volet 2 : urgences, pour le particulier</h3><ul>
      <li>Porte claquée, effraction : une demande urgente en quelques clics</li>
      <li>Envoyée aux installateurs du secteur d’astreinte, le premier qui accepte intervient</li>
      <li>Notifications instantanées sur l’appli mobile</li></ul>
      <p class="gain">{ic("trending-up","pi")} Du chiffre d’affaires additionnel pour le réseau, une marque présente dans l’urgence</p></div>
  </div>
  <div class="bandeau mt">
    <div>{ic("timer")}<b>Délai de résolution</b><small>Une partie des pannes réglée sans attendre le SAV.</small></div>
    <div>{ic("chart-pie")}<b>Pannes récurrentes</b><small>La direction voit les défauts produits et agit à la source.</small></div>
    <div>{ic("handshake")}<b>Réseau valorisé</b><small>Les urgences deviennent des clients pour les installateurs Picard.</small></div>
  </div>
  <div class="flux mt">
    <div><span>{ic("search")}</span><b>Symptôme</b><small>« La porte frotte en bas »</small></div><i>{ic("arrow-right")}</i>
    <div><span>{ic("stethoscope")}</span><b>Diagnostic</b><small>3 questions guidées</small></div><i>{ic("arrow-right")}</i>
    <div><span>{ic("wrench")}</span><b>Solution</b><small>Réglage des paumelles, vidéo de 2 minutes</small></div><i>{ic("arrow-right")}</i>
    <div class="alt"><span>{ic("life-buoy")}</span><b>Sinon, SAV</b><small>Demande créée et déjà qualifiée</small></div>
  </div>
  <p class="citation">Le volet 1 réutilise le SAV, le volet 2 réutilise les leads : la rubrique coûte peu, parce que le socle existe.</p>
  {pied(7)}
</section>''')

# ───────── 8. Expérience ─────────
etapes = [
 ("file-input","La demande arrive","Formulaire du site, configurateur, appel : chaque demande entre dans l’Espace Pro, complète et horodatée."),
 ("user-check","Elle est qualifiée et orientée","Le Lead Manager l’attribue au bon installateur du secteur grâce au zoning."),
 ("bell-ring","L’installateur accepte en un clic","E-mail, SMS ou notification, délai visible, coordonnées débloquées à l’acceptation."),
 ("calculator","Il conseille, configure et chiffre","Configurateur et documentation pour un devis juste, rapidement."),
 ("receipt","La commande est rapprochée","Le lead est relié à la commande : la transformation réelle est mesurée."),
 ("stethoscope","Dépannage et SAV","Diagnostic guidé, puis demande SAV avec photos si nécessaire, suivi transparent."),
 ("star","La satisfaction est mesurée","Enquêtes auprès du client et de l’installateur, score de recommandation."),
 ("gift","La fidélité est récompensée","Points, boutique, opérations nationales et parrainage."),
]
eh = "".join(f'<div class="etape"><div class="rond">{ic(e[0])}<em>{i+1}</em></div><div><h3>{e[1]}</h3><p>{e[2]}</p></div></div>' for i,e in enumerate(etapes))
pages.append(f'''<section class="page">
  {entete("route","L’expérience cible","De la demande du particulier à la fidélité de l’installateur","Demain, chaque étape du parcours sera accompagnée et reliée : client final, installateur, commercial, Lead Manager, SAV et direction travailleront sur la même information.")}
  <div class="parcours large mt">{eh}</div>
  <p class="citation">Chaque étape produit une donnée utile à la suivante : c’est ce qui rend le parcours mesurable de bout en bout.</p>
  {pied(8)}
</section>''')

# ───────── 9. Faisabilité ─────────
pages.append(f'''<section class="page">
  {entete("circle-check-big","Faisabilité","Un projet maîtrisé, avec un prototype déjà en ligne","Le risque principal d’un tel projet est de partir de zéro. Ce n’est pas le cas : un socle fonctionnel existe, et il a permis de valider les choix techniques et l’ergonomie avec les premiers utilisateurs.")}
  <div class="g2 mt">
    <div class="carte or">{tuile("rocket")}<h3>Déjà démontré dans le prototype</h3><ul>
      <li>Accueil personnalisé par rôle, messages et agenda du réseau</li>
      <li>Leads : attribution, zoning, rapprochement avec les commandes</li>
      <li>Médiathèque, opérations nationales, boutique</li>
      <li>Campagnes e-mail, enquêtes, indicateurs marketing</li>
      <li>Droits par rôle et aperçu « voir en tant que »</li></ul></div>
    <div class="carte">{tuile("server")}<h3>Des choix techniques sûrs</h3><ul>
      <li>Technologies standard et répandues, sans dépendance à un éditeur</li>
      <li>Hébergement en Europe, données propriété de Picard</li>
      <li>Sécurité contrôlée par la base : chacun ne voit que ses données</li>
      <li>Application mobile construite sur la même logique métier</li>
      <li>Coûts d’hébergement proportionnels à l’usage</li></ul></div>
  </div>
  <div class="chiffres mt">
    <div>{ic("milestone")}<b>Par étapes</b><span>Chaque phase livre un résultat utilisable et peut être arrêtée ou réorientée.</span></div>
    <div>{ic("users-round")}<b>Avec les métiers</b><span>Chaque rubrique est validée sur une fiche d’une page, puis testée par ses utilisateurs.</span></div>
    <div>{ic("refresh-cw")}<b>Sans rupture</b><span>Les anciens outils restent actifs jusqu’à la bascule de chaque rubrique.</span></div>
  </div>
  <div class="decision mt"><b>{ic("monitor","pi")} À voir avant de décider</b><p>Le prototype peut être présenté en démonstration de vingt minutes : accueil d’un installateur, traitement d’un lead, opération nationale, vue de la direction.</p></div>
  {pied(9)}
</section>''')

# ───────── 10. Feuille de route ─────────
PHASES = [
 ("p1", "Phase 1 : fondations", 0, 3, "Leads et notifications en service, SAV complet, dépannage guidé, médiathèque reprise", "Arrêt Enet, Dropbox, Qualios"),
 ("p2", "Phase 2 : vendre et fidéliser", 3, 6, "Configurateur portes, opérations nationales, boutique, reproduction de clés, campagnes", "Arrêt MyPricer et des tableurs"),
 ("p3", "Phase 3 : terrain et direction", 6, 9, "CRM, tournées, gestion des opérations, boîte à outils, commande serrures, Picard 2030, KPI", "Équipe commerciale sur l’outil"),
 ("p4", "Phase 4 : mobilité et urgence", 9, 12, "Appli iPhone et Android, dépannage urgent, reprise complète de l’historique, bilan", "Bascule complète"),
]
mois = "".join(f'<span>M{m}</span>' for m in range(1, 13))
barres = "".join(f'<div class="lg"><div class="lb"><b>{p[1]}</b><small>{p[4]}</small></div><div class="piste"><div class="barre {p[0]}" style="left:{p[2]/12*100:.2f}%;width:{(p[3]-p[2])/12*100:.2f}%"></div><span class="jalon" style="left:{p[2]/12*100:.2f}%">{ic("flag","pi")}{p[5]}</span></div></div>' for p in PHASES)
pages.append(f'''<section class="page">
  {entete("calendar-range","Feuille de route","Douze mois, quatre phases, des résultats à chaque étape","L’ordre suit la valeur : d’abord ce qui arrête les abonnements les plus coûteux et sert le plus le réseau, ensuite les outils terrain et direction, enfin la mobilité.")}
  <div class="gantt mt"><div class="mois"><span></span>{mois}</div>{barres}</div>
  <div class="g4 mt">
    <div class="point">{ic("calendar-range")}<b>Cadrage</b><span>Deux à quatre semaines : fiches rubriques, reprise des données, budget détaillé.</span></div>
    <div class="point">{ic("graduation-cap")}<b>Formation</b><span>Ambassadeurs du réseau, tutoriels courts, accompagnement à chaque bascule.</span></div>
    <div class="point">{ic("database")}<b>Reprise</b><span>L’historique de chaque ancien outil est importé avant son arrêt.</span></div>
    <div class="point">{ic("chart-line")}<b>Mesure</b><span>Un bilan à la fin de chaque phase avant d’engager la suivante.</span></div>
  </div>
  <table class="risq mt"><thead><tr><th>Fin de phase</th><th>Ce qui est mesuré au bilan</th></tr></thead><tbody>
    <tr><td><span class="ph p1">P1</span> Fondations</td><td>Délai d’acceptation des leads, part des SAV déclarés en ligne, pannes résolues par le dépannage</td></tr>
    <tr><td><span class="ph p2">P2</span> Vendre et fidéliser</td><td>Devis issus du configurateur, participation aux opérations, points dépensés en boutique</td></tr>
    <tr><td><span class="ph p3">P3</span> Terrain et direction</td><td>Visites saisies, opérations déployées, commandes passées en ligne</td></tr>
    <tr><td><span class="ph p4">P4</span> Mobilité et urgence</td><td>Installateurs actifs sur l’appli, urgences traitées, outils arrêtés</td></tr>
  </tbody></table>
  {pied(10)}
</section>''')

# ───────── 11. Coûts ─────────
pages.append(f'''<section class="page">
  {entete("coins","Coûts","Un investissement maîtrisé, des coûts de fonctionnement en baisse","Ordres de grandeur à affiner lors du cadrage. Ils reposent sur le prototype existant et sur un développement piloté en interne.")}
  <div class="scen mt">
    <div class="sc">{ic("building","pi") if "building" in I else ic("briefcase","pi")}<b>Approche classique</b><p>Agence ou intégrateur, cahier des charges complet, développement de zéro.</p><div class="m">150 à 250 k€</div><small>12 à 18 mois avant la première mise en service complète</small></div>
    <div class="sc reco"><span class="tag">Recommandé</span>{ic("rocket","pi")}<b>Approche proposée</b><p>Prototype existant, développement assisté par IA, pilotage par un chef de projet métier, tests par les utilisateurs.</p><div class="m">40 à 90 k€</div><small>Premiers résultats en trois mois, déploiement complet en douze</small></div>
  </div>
  <table class="couts mt"><thead><tr><th>Fonctionnement annuel</th><th>Aujourd’hui</th><th>Avec l’Espace Pro</th></tr></thead><tbody>
    <tr><td>Abonnements Dropbox, Enet, Qualios, MyPricer</td><td>30 à 60 k€</td><td>0 €</td></tr>
    <tr><td>Hébergement, base de données, stockage</td><td>inclus ci-dessus</td><td>0,5 à 1 k€</td></tr>
    <tr><td>E-mails et SMS (selon volumes)</td><td>variable</td><td>0,1 à 0,4 k€</td></tr>
    <tr><td>Publication de l’appli sur les stores</td><td>non</td><td>0,1 k€</td></tr>
    <tr><td>Maintenance et évolutions</td><td>dispersée</td><td>en interne</td></tr>
    <tr class="tot"><td>Total annuel</td><td>30 à 60 k€</td><td>≈ 1 k€</td></tr>
  </tbody></table>
  <div class="barres mt">
    <div class="ln"><span>Aujourd’hui</span><div class="tr"><i class="ajd" style="width:50%"></i><i class="ajd2" style="width:50%"></i></div><b>30 à 60 k€ par an</b></div>
    <div class="ln"><span>Espace Pro</span><div class="tr"><i class="ep" style="width:1.2%"></i><i class="ep2" style="width:1.3%"></i></div><b>≈ 1 k€ par an</b></div>
  </div>
  <p class="note">Le coût de l’approche proposée couvre le temps projet, l’accompagnement technique, la reprise des données et la formation. Le budget détaillé sera présenté à l’issue du cadrage.</p>
  {pied(11)}
</section>''')

# ───────── 12. Gains et ROI ─────────
pages.append(f'''<section class="page">
  {entete("hand-coins","Gains et retour sur investissement","Un projet qui se finance en grande partie par ses économies","Trois sources de valeur, de la plus certaine à la plus importante. Les montants ci-dessous sont des exemples à recalculer avec les chiffres réels de Picard.")}
  <div class="gains3 mt">
    <div class="gx"><span class="niv">Certain</span>{ic("piggy-bank")}<b>Abonnements arrêtés</b><div class="m">29 à 59 k€</div><small>par an : 30 à 60 k€ d’abonnements, moins environ 1 k€ de fonctionnement</small></div>
    <div class="gx"><span class="niv">Probable</span>{ic("clock")}<b>Temps gagné</b><div class="m">≈ 2 000 h</div><small>par an : exemple de 30 collaborateurs gagnant 1 h 30 par semaine sur les ressaisies, relances et recherches</small></div>
    <div class="gx fort"><span class="niv">Levier principal</span>{ic("trending-up")}<b>Ventes</b><div class="m">+ 150 k€</div><small>de CA : exemple de 2 000 leads par an, 3 points de transformation en plus, panier moyen de 2 500 €</small></div>
  </div>
  <div class="roi mt">
    <div><b>Retour sur investissement</b><p>Sur les seules économies d’abonnements, l’investissement est couvert en deux ans. En valorisant le temps gagné, il l’est dès la première année pleine, avant même l’effet sur les ventes.</p></div>
    <div class="qual"><b>Et ce qui ne se chiffre pas</b><ul>
      <li>{ic("check")}Une donnée unique, propriété de Picard</li><li>{ic("check")}Une image de marque modernisée</li>
      <li>{ic("check")}Un réseau plus fidèle, plus facile à recruter</li><li>{ic("check")}Une base pour les projets futurs</li></ul></div>
  </div>
  <table class="couts trois-ans mt"><thead><tr><th>Solde cumulé, scénario médian</th><th>Année 1</th><th>Année 2</th><th>Année 3</th></tr></thead><tbody>
    <tr><td>Abonnements seuls (65 k€ investis, 44 k€ économisés par an, demi-année en année 1)</td><td class="neg">− 43 k€</td><td class="pos">+ 1 k€</td><td class="pos">+ 45 k€</td></tr>
    <tr><td>Avec le temps gagné valorisé à 35 € de l’heure (moitié en année 1)</td><td class="neg">− 8 k€</td><td class="pos">+ 106 k€</td><td class="pos">+ 220 k€</td></tr>
  </tbody></table>
  <p class="note">Hors effet sur les ventes. Hypothèses à remplacer par les chiffres réels de Picard lors du cadrage.</p>
  {pied(12)}
</section>''')

# ───────── 13. Risques et gouvernance ─────────
RISQUES = [
 ("users","Adoption par le réseau","Déploiement progressif, ambassadeurs, accueil simple, appli mobile, avantages fidélité liés à l’usage"),
 ("database","Reprise des données","Import de l’historique avant chaque arrêt d’outil, période de double fonctionnement"),
 ("lock","Sécurité et RGPD","Droits contrôlés par la base, hébergement européen, journalisation, données propriété de Picard"),
 ("network","Liens avec l’ERP","Commandes et tarifs branchés en phase 3, après validation des échanges avec Navision"),
 ("milestone","Dérive du périmètre","Une fiche validée par rubrique, un bilan par phase, un comité qui arbitre"),
]
rq = "".join(f'<tr><td><div class="rn">{tuile(r[0])}<b>{r[1]}</b></div></td><td>{r[2]}</td></tr>' for r in RISQUES)
pages.append(f'''<section class="page">
  {entete("shield-check","Risques et gouvernance","Des risques identifiés, une organisation simple")}
  <table class="risq mt"><thead><tr><th>Risque</th><th>Comment il est maîtrisé</th></tr></thead><tbody>{rq}</tbody></table>
  <div class="g3 mt">
    {carte("gavel","Comité de pilotage","Direction générale, commerce, marketing, SAV. Un point par mois, une décision à chaque fin de phase.","or")}
    {carte("user-check","Chef de projet métier","Priorise, valide les fiches rubriques, organise les tests et la formation.","or")}
    {carte("chart-column","Indicateurs de succès","Taux d’usage du réseau, délai d’acceptation des leads, demandes SAV évitées, abonnements arrêtés.","or")}
  </div>
  <p class="famille mt">Les quatre premières semaines après validation</p>
  <div class="semaines">
    <div><em>S1</em><b>Lancement</b><span>Comité de pilotage, chef de projet, calendrier</span></div>
    <div><em>S2</em><b>Fiches phase 1</b><span>Leads, SAV, dépannage, médiathèque validés par les métiers</span></div>
    <div><em>S3</em><b>Plan de reprise</b><span>Exports Enet, Qualios et Dropbox, règles d’import</span></div>
    <div><em>S4</em><b>Budget détaillé</b><span>Chiffrage précis de la phase 1, feu vert du comité</span></div>
  </div>
  {pied(13)}
</section>''')

# ───────── 14. Autres pistes ─────────
pages.append(f'''<section class="page">
  {entete("sparkles","Pistes à explorer","Ce que la plateforme rendra possible ensuite","Une fois le réseau réuni sur un même outil, de nouvelles sources de valeur deviennent accessibles. Elles ne sont pas dans le budget de base, mais méritent d’être étudiées.")}
  <div class="g2 mt">
    {carte("brain-circuit","Assistant technique intelligent","Une assistance qui répond aux questions des installateurs à partir des notices et des solutions de dépannage, jour et nuit.")}
    {carte("hand-coins","Leads facturés","Une facturation des leads paramétrable par niveau de partenaire, qui finance une partie de l’acquisition.")}
    {carte("handshake","Partenaires cofinanceurs","Opérations et récompenses de la boutique cofinancées par les fournisseurs et partenaires de Picard.")}
    {carte("globe","Ouverture aux distributeurs","Le même outil proposé aux distributeurs et aux grands comptes, avec leurs propres droits.")}
    {carte("chart-pie","Valorisation des données","Défauts produits, besoins par région, prix pratiqués : des données pour orienter la gamme et les investissements.")}
    {carte("users-round","Recrutement du réseau","Un parcours d’adhésion en ligne pour les zones blanches, appuyé sur l’attractivité de l’outil.")}
  </div>
  <p class="citation">La plateforme n’est pas seulement un outil de gestion : elle devient un actif de l’entreprise, qui prend de la valeur avec chaque installateur connecté.</p>
  {pied(14)}
</section>''')

# ───────── 15. Décision ─────────
pages.append(f'''<section class="page final">
  <p class="sur">{ic("gavel","si")} Décision demandée</p>
  <h2>Lancer la phase 1</h2>
  <p class="intro">Un engagement limité et réversible : trois mois pour mettre en service les leads, le SAV et le dépannage guidé, arrêter les premiers abonnements et mesurer les résultats avant d’aller plus loin.</p>
  <div class="liste-f mt">
    <div>{tuile("check")}<div><b>Valider le lancement</b><span>Phase de cadrage de deux à quatre semaines, puis phase 1 sur trois mois.</span></div></div>
    <div>{tuile("coins")}<div><b>Valider le budget de la phase 1</b><span>Montant précis présenté à l’issue du cadrage, dans l’enveloppe globale de 40 à 90 k€.</span></div></div>
    <div>{tuile("user-check")}<div><b>Nommer un chef de projet métier</b><span>Et constituer le comité de pilotage.</span></div></div>
    <div>{tuile("calendar-range")}<div><b>Fixer le premier bilan</b><span>À trois mois : usage, délais, abonnements arrêtés, retours du réseau.</span></div></div>
  </div>
  <div class="conclusion">{CARRES}<p>Un seul outil pour tout le réseau,<br><em>en douze mois.</em></p><small>Vendre plus, dépenser moins, fidéliser le réseau.</small></div>
  {pied(15)}
</section>''')

html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Espace Pro Picard Serrures, dossier de décision</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&display=block" rel="stylesheet"><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'''
open('decision.html','w').write(html)
print(len(pages), "pages")
