const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Parse the youth data from the user's list
const rawData = `KAY2070EM	Emily	Munywoki	41435294	746139777	22	Female	kayole_soweto	muungano	
KAY498AW	Anne	Wainaina	41358110	740660538	22	Female	kayole_soweto	muungano	
KAY2065BW	Bonface	Mwaura	41349150	707511260	22	Male	kayole_soweto	patanisho	
KAY1278MK	Michelle	Kinya	41880238	746349917	21	Female	kayole_soweto	patanisho	
KAY2675PM	Peterson	Mwangi	41494854	710685416	22	Male	kayole_soweto	shauri_yako	
KAY413GG	George	Githua	39717721	795656724	22	Male	kayole_soweto	muungano	
KAY1042KM	Keziah	Maina	41824335	726547463	23	Female	kayole_soweto	muungano	
KAY1008BO	Brian	Otieno	41255406	111619919	22	Male	kayole_soweto	musesa	
KAY264EM	Esther	Mwangi	40185560	797099994	24	Female	kayole_soweto	kibagare	
KAY1007FO	Faith	Ochieng	42039342	757191482	21	Female	kayole_soweto	gitau	
KAY1498DO	David	Ouma	523579589	757528142	21	Male	kayole_soweto	muthaiga	None
KAY465DO	David	Omondi	40900109	115200105	25	Female	kayole_soweto	musesa	
KAY744IA	Isaac	Oduory	40705534	727764532	23	Male	kayole_soweto	muoroto	
KAY1604FA	Fidelis	Wanjiru	850262763	740623034	21	Female	kayole_soweto	gitau	
KAY2802NM	Naffert	Mburu	42550958	794150696	21	Male	kayole_soweto	kibagare	
KAY237FM	Faith	Mutua	38129284	792117359	25	Female	kayole_soweto	muungano	
KAY1000GN	Grace	Syombua	37251100	710826241	28	Female	kayole_soweto	kibagare	None
KAY1619JG	Josphat	Gitahi	41357635	715312083	23	Male	kayole_soweto	muungano	
KAY2412FO	Felix	Ochieng	34696001	731202052	27	Male	kayole_soweto	central	
KAY1990MM	Monica	Mawilu	466993797	769640538	22		kayole_soweto	muoroto	
KAY2188EG	Ephantus	Githinji	40107753	115981094	23	Male	kayole_soweto	muoroto	
KAY2501CM	Caroline	Maina	40100859	795878939	23	Female	kayole_soweto	muthaiga	
KAY2423BO	Brian	Ogeloh	33341931	713560348	31	Male	kayole_soweto	muoroto	
KAY2647MN	Mary	Ndenga	38338947	705817650	25	Female	kayole_soweto	musesa	
KAY760SK	Stephen	Karanja	43189128	705647200	21	Male	kayole_soweto	patanisho	
KAY1230CA	Clinton	Awino	39280438	745919991	23	Male	kayole_soweto	central	
KAY2251TK	Titus	Kutula	41844763	715622655	22	Male	kayole_soweto	central	
KAY2531JO	Jackson	Ochieng	37885445	710477935	26	Male	kayole_soweto	muoroto	None
KAY2093GN	Geoffrey	Ndegwa	33983141	728575150	29	Male	kayole_soweto	musesa	
KAY1154SO	Steven	Odhiambo	36117151	793953724	27	Female	kayole_soweto	shauri_yako	None
KAY2015NM	Natalia	Mukoya	41200261	712188478	22	Female	kayole_soweto	central	
KAY1528CM	Celine	Macharia	38995789	741206229	24	Female	kayole_soweto	muoroto	
KAY1537MW	Maurine	Apora	36745001	727762051	26	Female	kayole_soweto	shauri_yako	None
KAY2615VO	Victor	Omolo	39606401	757156587	25	Male	kayole_soweto	musesa	
KAY955HO	Hillam	Osogo	36420595	794818612	27	Male	kayole_soweto	shauri_yako	
KAY2549EG	Edward	Opiyo	39260398	796667070	27	Male	kayole_soweto	musesa	
KAY2529RW	Ruth	Wainaina	39297793	705956964	24	Female	kayole_soweto	muoroto	
KAY2579JN	Jane	Njuguna	38454037	729247877	24	Female	kayole_soweto	musesa	
KAY2301SA	Solomon	Ashiono	40824248	714817438	23	Male	kayole_soweto	central	
KAY974VE	Vivian	Ekhalie	790907801	719634246	20	Female	kayole_soweto	central	
KAY2071PG	Pharis	Gacini	37726306	706792036	25	Male	kayole_soweto	musesa	
KAY2239NW	Wanjiku	Waithera	41461765	757782571	23	Female	kayole_soweto	muungano	Communication (some difficulty)
KAY129SL	Selina	Lipukah	305733708	115463624	20	Female	kayole_soweto	patanisho	
KAY2279JN	Joseph	Maina	892426549	742154129	20	Male	kayole_soweto	patanisho	
KAY1177MS	Mary	Hatayi	149226926	115324919	19	Female	kayole_soweto	musesa	
KAY1223AK	Annah	Kimakiru	319041422	795274475	19	Female	kayole_soweto	central	
KAY1731EM	Esther	Maina	137752864	717853168	21	Female	kayole_soweto	kibagare	
KAY450PM	Pauline	Misigo	32283733	757478386	30	Female	kayole_soweto	gitau	Cognitive (some difficulty)
KAY2642PO	Philisian	Ochieng	403561138	793779393	19	Male	kayole_soweto	musesa	
KAY204DA	Dorothy	Amimo	35326480	796938335	27	Female	kayole_soweto	muoroto	Cognitive (some difficulty); Self-care (some difficulty); Communication (a lot of difficulty)
KAY1771NN	Nancy	Nderitu	28703703	702466412	35	Female	kayole_soweto	patanisho	Communication (some difficulty)
KAY880LK	Lucywell	Kiunjuri	166794018a	796655450	18	Female	kayole_soweto	muungano	
KAY098JO	Juliet	Achieng	446929288	705421872	20	Female	kayole_soweto	shauri_yako	
KAY1267DA	Dorine	Opati	40392239	793962379	23	Female	kayole_soweto	shauri_yako	Vision (some difficulty); Cognitive (some difficulty); Self-care (some difficulty)
KAY1383EN	Edward	Njue	33574512	721271513	30	Male	kayole_soweto	muungano	Mobility (some difficulty)
KAY2411FM	Flevian	Muhonja	42766232	745407464	23	Female	kayole_soweto	bahati	Hearing (some difficulty)
KAY2079CI	Cynthia	Injete	36764805	794081447	27	Female	kayole_soweto	gitau	Vision (some difficulty); Pregnant
KAY2031KM	Kelly	Muigai	805364811	711918906	19	Male	kayole_soweto	muungano	
KAY157CA	Cynthia	Atieno	37856188	743124294	25	Female	kayole_soweto	central	Self-care (some difficulty); Communication (some difficulty)
KAY614FO	Francis	Okello	201258445	769154831	21	Male	kayole_soweto	muungano	Self-care (some difficulty)
KAY132DN	David	Ngemi	679215987	717383732	19	Male	kayole_soweto	gitau	
KAY2587RM	Rooney	Masila	562431522	799739055	19	Male	kayole_soweto	muungano	
KAY2603GK	Gilbert	Karigo	29114677	718321138	33	Male	kayole_soweto	gitau	Vision (some difficulty)
KAY1628CK	Colleta	Kiteme	32322387	713517416	31	Female	kayole_soweto	bahati	Mobility (some difficulty)
KAY2698JO	Joram	Okanga	29132596	759239280	34	Male	kayole_soweto	central	Cognitive (cannot do at all)
KAY1556SN	Salome	Njoroge	37479923	725070150	26	Female	kayole_soweto	central	Communication (some difficulty)
KAY900JO	Juliet	Ojwang	32501524	717538260	32	Female	kayole_soweto	bahati	Vision (some difficulty)
KAY1143IM	Ivor	Mwangi	188658776	719862882	19	Male	kayole_soweto	gitau	
KAY2034MN	Mark	Ndung'u	233979668	700476878	19	Male	kayole_soweto	muoroto	Cognitive (some difficulty)
KAY1791ZA	Zaina	Anakoli	28385230	716141192	33	Female	kayole_soweto	bahati	Hearing (some difficulty); Cognitive (cannot do at all); Self-care (some difficulty); Communication (some difficulty)
KAY1973FM	Francis	Mwendwa	42023863	793545104	21	Male	kayole_soweto	central	
KAY1803FZ	Florence	Zacharia	33966777	706456045	29	Female	kayole_soweto	bahati	Vision (some difficulty)
KAY1725LK	Lynn	Waweru	780840244	706789450	19	Male	kayole_soweto	kibagare	None
KAY2313AN	Annzippy	Njoroge	42903020	742552996	20	Female	kayole_soweto	gitau	Vision (some difficulty); Pregnant
KAY514JA	Joan	Anyango	39296862	769646171	28	Female	kayole_soweto	muthaiga	Mobility (some difficulty); Pregnant
KAY621AM	Ann	Mwangi	29664569	704694663	32	Female	kayole_soweto	muthaiga	Cognitive (some difficulty)
KAY2465DN	Daniel	Ngugi	553603845	742406611	20		kayole_soweto	bahati	
KAY1506DM	Dennis	Mutinda	859550668	742185790	19	Male	kayole_soweto	patanisho	
KAY1040DW	Daina	Wasike	38522306	705660877	26	Female	kayole_soweto	kibagare	Hearing (some difficulty)
KAY652BO	Beatrice	Ochieng	35424954	708444574	27	Female	kayole_soweto	patanisho	Communication (some difficulty)
KAY2687MN	Mary	Nthenya	37851779	797282323	25	Female	kayole_soweto	patanisho	None
KAY1390RB	Rehema	Bwakali	41598355	701090122	21	Female	kayole_soweto	muthaiga	Mobility (some difficulty); Self-care (some difficulty)
KAY2744EK	Elizabeth	Kariuki	42744192	746380291	20	Female	kayole_soweto	muungano	Cognitive (some difficulty)
KAY620JH	Jacklyne	Megere	37677046	711343049	29	Female	kayole_soweto	muthaiga	Vision (some difficulty)
KAR040JK	John	Kioko	3888359	112478735	27	Male	kariobangi		
KAR422MM	Mercy	Musango	41977223	758177306	21	Female	kariobangi		
KAR115SO	Sophie	Gesare	794479841	112813810	19	Female	kariobangi		
KAR127FM	Faith	Mutinda	34318025	793823590	28	Female	kariobangi		
		Emily	Musau	29553553	741379845	35	Female	kariobangi		
		Wesly	Kimuyu	543796835	729265123	19	Male	kariobangi		
		Denis	Musau	42227405	796428495	22	Male	kariobangi		
		Sydney	Kiamba	42732788	743341628	20	Male	kariobangi		
		Grace	Mutunga	39926988	790615665	23	Female	kariobangi		
KAR345WM	Wambua	Mainga	34536229	757073175	29	Male	kariobangi		
KAR350MM	Mourine	Mweu	36878805	741400723	28	Female	kariobangi		
KAR370PM	Patrick	Musuu	845586848	114942889	21	Male	kariobangi		
KAR192TK	Titus	Kioko	41419548	768166056	24	Male	kariobangi		
KAR268SM	Samuel	Matheka	32464224	716063337	30	Male	kariobangi		
KAR074GA	George	Alaka	39014943	748110515	25	Male	kariobangi		
KAR188MN	Michael	Ngumbi	38528535	758966046	24	Male	kariobangi		
KAR189CM	Charity	Mueni	42036314	718291440	21	Female	kariobangi		
KAR153SN	Sarah	Nzyoki	30915007	798402449	31	Female	kariobangi		Vision (some difficulty)
KAR297CM	Chriss	Mutua	42130301	714965792	22	Male	kariobangi		
KAR393CM	Catherine	Maweu	36921660	799545888	27	Female	kariobangi		
KAR439SN	Stephen	Nthiwa	36617631	720437342	26	Male	kariobangi		
KAR008CM	Christine	Mwaniki	194089492	707112206	22	Female	kariobangi		
KAR456PE	Patricia	Elizabeth	41299013	708254481	21	Female	kariobangi		
KAR399JM	Josephat	Mwanthi	39008822	719766594	25	Male	kariobangi		
KAR212MN	Margaret	Ngalama	30531827	702726453	32	Female	kariobangi		
KAR342RK	Ronald	Kyalo	42863722	115964528	21	Male	kariobangi		
KAR412CM	Caroline	Mumina	39870899	757322210	24	Female	kariobangi		Vision (some difficulty)
KAR447MK	Mark	Mutinda	280403593	748163729	19	Male	kariobangi		
KAR282PM	Prisca	Musau	37944617	740688025	26	Female	kariobangi		
KAR119BN	Bill	Njiru	39801712	793946829	24	Male	kariobangi		
KAR128DM	David	Mutua	36408216	798234144	27	Male	kariobangi		None
KAR090KM	Kelvin	Maithya	38386292	700610206	24	Male	kariobangi		None
KAR385JM	Jackline	Musengya	37802853	758944215	25	Female	kariobangi		None
KAR394EM	Elkana	Musembi	32594065	705837582	31	Male	kariobangi		None
KAR096WM	Wycliffe	Mbui	39828459	757762076	24	Male	kariobangi		None
KAR078KM	Kelvin	Mulela	42580985	758429438	21	Male	kariobangi		
KAR225CT	Charity	Titus	37025915	758161907	27	Female	kariobangi		
KAR341CW	Caroline	Wavinya	39305710	112203144	23	Female	kariobangi		None
KAR290SK	Simeon	Kenga	39717739	113702025	24	Male	kariobangi		None
KAR083JK	Joel	Kihuria	38322816	794456923	26	Male	kariobangi		
KAR285JM	June	Mumo	39318805	745775219	23	Female	kariobangi		None
KAR327EM	Eddis	Maina	40326505	741192117	24	Female	kariobangi		None
KAR323PK	Philles	Kasyoka	39020241	112321845	24	Female	kariobangi		Communication (some difficulty)
KAR339PM	Peter	Muia	37563136	722845192	25	Male	kariobangi		None
KAR386DM	Domitilla	Mutunga	29013225	703345542	33	Female	kariobangi		Vision (some difficulty)
KAR284KM	Kevin	Muthusi	40119400	705720673	24	Male	kariobangi		None
KAR092GS	Gloria	Sammy	39009851	795589084	26	Female	kariobangi		
KAR135NM	Nicholas	Mwendwa	35516925	798483194	28	Male	kariobangi		Vision (some difficulty)
KAR224FM	Fredinah	Mbai	34637941	790729611	30	Female	kariobangi		None
KAR009MM	Mercy	Muendo	35976262	742816385	27	Female	kariobangi		None
KAR108BM	Brian	Mutinda	41298602	793486620	23	Male	kariobangi		
KAR181SM	Stacey	Mutheu	39884916	742685927	23	Female	kariobangi		None
KAR112CM	Muindi	Mbindya	34393609	795915014	32	Male	kariobangi		None
KAR023MK	Magdalene	Kioko	36349646	791189262	29	Female	kariobangi		
KAR388JM	Jane	Mwikya	37066716	110083936	27	Female	kariobangi		None
KAR208TS	Theophilus	Samson	37487556	724447970	27	Male	kariobangi		None
KAR404RM	Richard	Muthengi	41588801	746374480	22	Male	kariobangi		None
KAR102FK	Francis	Kyalo	41652712	716640968	23	Male	kariobangi		Vision (a lot of difficulty); Hearing (some difficulty)
KAR187SM	Samuel	Mutuku	29361872	727712977	33	Male	kariobangi		None
KAR322FK	Festus	Kaluki	29978724	742088747	33	Male	kariobangi		Mobility (a lot of difficulty)
KAR298DK	Diana	Kasyula	34881547	712269056	27	Female	kariobangi		None
KAR446FM	Faith	Musau	38414660	743944625	25	Female	kariobangi		None
KAR026MM	Milcah	Mwalimu	42476915	707488823	21	Female	kariobangi		
KAR371MM	Melody	Mutuku	32542073	708780354	30	Female	kariobangi		
KAR019JM	Joseph	Muta	31587688	704554924	31	Male	kariobangi		
KAR191VM	Virginia	Mbithe	606001054	117118687	22	Female	kariobangi		None
KAR029AN	Abednego	Ngina	37794306	719576997	25	Male	kariobangi		None
KAR369JJ	Jeremiah	James	37924586	799294718	25	Male	kariobangi		None
KAR110CK	Cynthia	Kituku	29923036	725615566	33	Female	kariobangi		Mobility (cannot do at all)
KAR106JM	Janet	Mwalimu	31532369	717443163	32	Female	kariobangi		Mobility (a lot of difficulty); Self-care (some difficulty)
KAR158KK	Kelvin	Kinyatta	33107603	114178846	29	Male	kariobangi		None
HUR455MM	Martin	Mbugua	39840210	797786555	24	Male	mji_wa_huruma		Vision (cannot do at all)
HUR770AN	Abigael	Nguyo	35515592	702327420	26	Female	mji_wa_huruma		
HUR801DN	Dennis	Njuguna	39952811	794692928	24	Male	mji_wa_huruma		
		Margaret	Karita	41857569	728851865	21	Female	mji_wa_huruma		
		Ambrose	Gitau	38997818	716238780	25	Male	mji_wa_huruma		
		Michael	Nduati	35240193	797543113	28	Male	mji_wa_huruma		
HUR438PW	Paul	Njoroge	757754574	711529921	20	Male	mji_wa_huruma		
HUR765JN	John	Ngigi	38034939	748650160	24	Male	mji_wa_huruma		
HUR772BN	Benny	Nguyo	39469404	750791879	25	Female	mji_wa_huruma		
HUR185RN	Richard	Njuguna	41690306	795059568	22	Male	mji_wa_huruma		Self-care (some difficulty)
HUR386PM	Peter	Maina	40389584	796389823	22	Male	mji_wa_huruma		
HUR304AM	Anne	Mwangi	29245668	769397110	33	Female	mji_wa_huruma		
HUR788AW	Anne	Wambugu	35724239	799667584	27	Female	mji_wa_huruma		
HUR771VN	Virginia	Njoki	34943152	714691818	29	Female	mji_wa_huruma		Communication (cannot do at all)
HUR419AN	Anne	Nguyo	33683669	725028491	31	Female	mji_wa_huruma		
HUR468GW	George	Gitau	42317711	794305109	20	Male	mji_wa_huruma		
HUR756SD	Somo	Duba	42284396	717847997	23	Male	mji_wa_huruma		
HUR773MN	Margaret	Nyambura	34453985	701709304	26	Female	mji_wa_huruma		
HUR792SW	Susan	Wanja	36014634	793272166	27	Female	mji_wa_huruma		
HUR558AC	Ann	Chuhi	41470333	719235689	21	Female	mji_wa_huruma		
HUR600HW	Hannah	Wanjiku	41277881	716659327	23	Female	mji_wa_huruma		
HUR512MK	Maurine	Khaemba	560408205	798210157	19	Female	mji_wa_huruma		Communication (some difficulty)
HUR750CA	Caroline	Awinja	28788096	727685875	34	Female	mji_wa_huruma		Vision (some difficulty)
HUR478JM	John	Mbugua	663449519	725528860	20	Male	mji_wa_huruma		
HUR768SW	Stephen	Wanjiru	38833676	708851217	25	Male	mji_wa_huruma		
HUR659SM	Stephen	Muli	42832027	796234138	22	Male	mji_wa_huruma		
HUR610SW	Simon	Wambui	712972075	759211682	19	Male	mji_wa_huruma		
HUR616PN	Peter	Nduta	34932524	705067513	30	Male	mji_wa_huruma		
HUR703SN	Simon	Njeri	42414884	799864602	21	Male	mji_wa_huruma		
HUR452DM	Dorcas	Wanja	40390152	757861409	22	Female	mji_wa_huruma		
		Peter	Chege	33982498	714144802	30	Male	mji_wa_huruma		
HUR722KN	Kennedy	Nyakio	30708927	740514040	35	Male	mji_wa_huruma		
HUR343SK	Susan	Kimani	35517271	759969332	27	Female	mji_wa_huruma		
HUR394JG	Josephine	Gikurumi	30693705	723809692	32	Female	mji_wa_huruma		
HUR503EN	Edward	Nyakobi	42295491	711164601	22	Male	mji_wa_huruma		
HUR653LK	Lucia	Kimani	35216395	708191866	28	Female	mji_wa_huruma		
HUR689DM	Doricah	Motonu	716355507	796011378	19	Female	mji_wa_huruma		
HUR714AK	Alice	Karanja	41366680	759936866	21	Female	mji_wa_huruma		
HUR442JK	Jerusa	Kulali	32836590	757305386	32	Female	mji_wa_huruma		
HUR731AM	Ann	Muniu	36134498	703848964	26	Female	mji_wa_huruma		Cognitive (some difficulty)
HUR401NM	Nancy	Muthoni	34411957	713393820	29	Female	mji_wa_huruma		
HUR564KM	Lydia	Mwove	39461700	792363806	27	Male	mji_wa_huruma		
HUR007JK	Jane	Kamira	28936029	741799605	34	Female	mji_wa_huruma		
HUR259BK	Beatrice	Kombo	33832976	711124298	29	Female	mji_wa_huruma		
HUR794RN	Ruth	Njoroge	39715361	743711038	25	Female	mji_wa_huruma		
HUR581FM	Faith	Maganjo	41285732	796690037	23	Female	mji_wa_huruma		
HUR645EM	Esther	Mwaura	35979851	791995959	28	Female	mji_wa_huruma		
KAY1265DA	Denish	Alaro	39055353	702846564	26	Male	kayole_soweto	patanisho	Mobility (cannot do at all); Cognitive (cannot do at all)
KAY1045SN	Sicily	Nyaga	31032856	713398700	32	Female	kayole_soweto	muoroto	None
KAY1504BA	Brian	Koli	42682301	745018729	21	Male	kayole_soweto	shauri_yako	None
KAY2190FM	Francis	Muthoni	33983893	710548780	28	Male	kayole_soweto	muthaiga	None
KAY1640JM	Joab	Mandu	42782310	769934520	20	Male	kayole_soweto	shauri_yako	None
KAY2468HO	Hellen	Okoth	39549777	707263743	23	Female	kayole_soweto	musesa	None
KAY1799DM	David	Mandu	40496801	758778887	22	Male	kayole_soweto	shauri_yako	None
KAY2570SM	Samuel	Mbiyu	42047289	728730532	21	Male	kayole_soweto	kibagare	None
KAY2714DV	Doreen	Vutiti	37812985	799317489	25	Female	kayole_soweto	muoroto	None
KAY733CM	Catherine	Muli	514865081	790049809	22	Female	kayole_soweto	kibagare	None
KAY1043DB	Dennis	Bosire	28128190	714143328	35	Male	kayole_soweto	shauri_yako	None
KAY1681JM	Joyce	Motaroki	41765980	110062050	21	Female	kayole_soweto	gitau	None
KAY461VO	Valary	Ochieng'	40566240	797671931	22	Female	kayole_soweto	muungano	None
KAY1686FM	Fulavian	Misigo	38382801	718980483	24	Female	kayole_soweto	gitau	Vision (a lot of difficulty); Cognitive (some difficulty); Self-care (some difficulty)
KAY1975NM	Nancy	Mutinda	39817177	710854457	22	Female	kayole_soweto	muoroto	None
KAY1726RN	Reuben	Nyangweso	37356657	706327558	27	Male	kayole_soweto	muthaiga	None
KAY2134VW	Veronica	Wambua	39956293	792123815	22	Female	kayole_soweto	gitau	None
KAY778DT	Daudi	Tarangei	38311700	757165663	25	Male	kayole_soweto	muthaiga	None
KAY1746PW	Peter	Wanjeri	37786325	706447403	29	Male	kayole_soweto	muungano	Hearing (some difficulty)
KAY2705AO	Austine	Ongonga	39656945	715829299	24	Male	kayole_soweto	bahati	Mobility (some difficulty)
KAY886MN	Mary	Njoroge	32199778	727781821	32	Female	kayole_soweto	muoroto	None
KAY2568AI	Auther	Irungu	38783378	746627739	24	Male	kayole_soweto	bahati	None
KAY1053IO	Irene	Obeli	38782152	748257711	25	Female	kayole_soweto	muungano	None
KAY2333OO	Oketch	Ochieng	30550499	702740503	34	Male	kayole_soweto	bahati	Mobility (some difficulty)
KAY269JW	Josephine	Wambua	39777929	792205698	23	Female	kayole_soweto	muungano	None
KAY1166AM	Abigail	Mukoko	471486054	791350190	19	Female	kayole_soweto	musesa	None
KAY1395MO	Mercy	Moraa	39168987	748353538	25	Female	kayole_soweto	shauri_yako	Mobility (a lot of difficulty)
KAY1459VO	Vivian	Otieno	38616361	768576009	24	Female	kayole_soweto	patanisho	None
KAY2248LK	Louse	Kitunda	39897845	740153484	23	Female	kayole_soweto	muoroto	None
KAY2038SI	Solomon	Irungu	29415974	704246480	33	Male	kayole_soweto	central	None
KAY574GK	Getrude	Kamau	702272234	746288429	21	Female	kayole_soweto	shauri_yako	None
KAY1590MT	Mary	Theuri	41779274	790097671	21	Female	kayole_soweto	kibagare	None
KAY2085SB	Samuel	Bogonko	39717702	114460065	24	Male	kayole_soweto	kibagare	None
KAY716CW	Charity	Wavinya	38530874	713972935	24	Female	kayole_soweto	shauri_yako	Mobility (a lot of difficulty)
KAY251BK	Brian	Karani	39991406	748301706	22	Male	kayole_soweto	central	None
KAY346CC	Charles	Chomba	778611601	724176794	20	Male	kayole_soweto	central	None
KAY2754JD	Joyce	Daniel	37418482	745255633	27	Female	kayole_soweto	muoroto	None
KAY1398PO	Pauline	Owino	836171964	742930568	21	Female	kayole_soweto	bahati	None
KAY1449OO	Oginga	Onguko	32280983	711679682	30	Male	kayole_soweto	central	None
KAY2391LN	Lilian	Naliaka	39166611	757940987	24	Female	kayole_soweto	bahati	Mobility (a lot of difficulty)
KAY291SM	Sharon	Makanga	39563544	703727192	23	Female	kayole_soweto	musesa	None
KAY1092LJ	Lucy	Idarasia	40119224	743815945	26	Female	kayole_soweto	bahati	None
KAY2209BA	Bakhita	Awuor	837523899	757080536	19	Female	kayole_soweto	muthaiga	None
KAY273AK	Ann	Kasee	41343127	798288004	22	Female	kayole_soweto	muthaiga	Vision (some difficulty)
KAY1138SM	Stephen	Muturi	481091972	705958053	20	Male	kayole_soweto	muthaiga	None
KAY1971MW	Michelle	Waweru	39789302	794865282	22	Female	kayole_soweto	kibagare	Mobility (some difficulty)
KAY1380MM	Merlyne	Matseshe	37518787	745152212	28	Female	kayole_soweto	gitau	None
KAY2358JM	Jecinta	Munga	38936368	719667710	26	Female	kayole_soweto	patanisho	Cognitive (some difficulty)
KAY1840TM	Teddy	Mutua	40520768	769868181	22	Male	kayole_soweto	patanisho	Vision (some difficulty); Mobility (a lot of difficulty); Self-care (some difficulty)
KAY1255GO	George	Oduor	34347337	713052342	31	Male	kayole_soweto	muthaiga	None
KAY2729JW	Jane	Wambui	29336418	111293795	32	Female	kayole_soweto	gitau	None
KAY1145FW	Francis	Wanjau	33690102	718235618	28	Male	kayole_soweto	patanisho	None
KAY2653VM	Veronica	Mbithe	33192413	740287728	29	Female	kayole_soweto	bahati	Vision (a lot of difficulty); Hearing (a lot of difficulty); Mobility (a lot of difficulty); Cognitive (a lot of difficulty); Self-care (a lot of difficulty); Communication (a lot of difficulty)
KAY2284SM	Selah	Muema	41272996	793625421	23	Female	kayole_soweto	muoroto	None
KAY1614VA	Vivian Awino	Arango	40464144	746731273	23	Female	kayole_soweto	gitau	None
KAY2466GK	Grace	Kiio	41783198	723640973	21	Female	kayole_soweto	muoroto	Vision (some difficulty); Mobility (some difficulty)
KAY1353CW	Catherine	Wambua	31204677	712493556	34	Female	kayole_soweto	central	Vision (some difficulty)
KAY352VO	Veronica	Oluoch	31968960	702373382	34	Female	kayole_soweto	shauri_yako	None
KAY348RN	Regina	Nzoka	42307801	794031725	21	Female	kayole_soweto	gitau	None
KAY2491PL	Pauline	Lukhachi	42754214	740381067	20	Female	kayole_soweto	kibagare	None
KAY2772EB	Evans	Barasa	37978811	790176775	29	Male	kayole_soweto	kibagare	None
KAY924LO	Lilian	Ondieki	36107928	740121260	26	Female	kayole_soweto	bahati	None
KAY1966MN	Moses	Ndubi	33673117	759616953	29	Male	kayole_soweto	muthaiga	None
KAY1994KK	Kenan	Konde	42481864	743288111	23	Male	kayole_soweto	kibagare	None
KAY2427LM	Laventry	Munyeti	32818675	701727965	32	Female	kayole_soweto	gitau	None
KAY2546PW	Peter	Wambui	30569603	758084222	30	Male	kayole_soweto	kibagare	None
KAY2762ZA	Zainab	Ayub	41372757	115265153	21	Female	kayole_soweto	muungano	Communication (some difficulty)
KAY1062DM	Dolpine	Murengu	32710332	742154998	29	Female	kayole_soweto	musesa	None
KAY1198MN	Miriam	Nyakundi	42063346	114831660	23	Female	kayole_soweto	bahati	None
KAY2202FO	Faith	Ogongo	39296653	757273926	23	Female	kayole_soweto	muthaiga	Mobility (some difficulty)
KAY2544DG	Denis	Gitahi	37911492	713457008	25	Male	kayole_soweto	bahati	None
KAY868JN	Joy	Nzomo	279653268	790446692	20	Female	kayole_soweto	musesa	None
KAY1448PO	Paul	Omondi	40664765	769046919	24	Male	kayole_soweto	bahati	None
KAY209BM	Ben	Mutua	36420304	797042065	26	Male	kayole_soweto	patanisho	None
KAY2326TO	Tony	Oroko	37499342	745943380	25	Male	kayole_soweto	kibagare	None
KAY2140MN	Miriam	Namasaka	40176022	110462809	24	Female	kayole_soweto	shauri_yako	Vision (some difficulty)
KAY2080DM	Daniel	Maina	873004692	748076642	19	Male	kayole_soweto	musesa	None
KAY2490AM	Agnes	Mutuku	37512014	718769343	27	Female	kayole_soweto	shauri_yako	None
KAY1522KK	Ken	Kariuki	32889860	707790710	29	Male	kayole_soweto	patanisho	Hearing (a lot of difficulty)
KAY288SM	Stephen	Mathu	41765616	710254057	21	Male	kayole_soweto	muthaiga	None
KAY1914KM	Kelvin	Masai	37060930	714759387	26	Male	kayole_soweto	muungano	None
KAY467DN	Debrah	Nyaang'a	37852910	740157024	25	Female	kayole_soweto	shauri_yako	None
KAY946MM	Margaret	Mwangi	40693890	792008955	22	Female	kayole_soweto	kibagare	Vision (some difficulty); Mobility (a lot of difficulty); Cognitive (some difficulty)
KAY221DK	Dennis	Kanumi	41952148	706874088	22	Male	kayole_soweto	musesa	Vision (some difficulty); Mobility (cannot do at all); Cognitive (some difficulty); Self-care (cannot do at all); Communication (a lot of difficulty)
KAY2805JK	Joe	Kimani	37911721	759541446	26	Male	kayole_soweto	shauri_yako	None
HUR285MW	MARY	WANJA	314342936	708118182	19	Female	mji_wa_huruma		Vision (a lot of difficulty)
HUR751QN	Quinter	Akoth	32777813	710944067	31	Female	mji_wa_huruma		None
HUR728CM	Catherine	Mararo	35327007	702809841	28	Female	mji_wa_huruma		None
HUR707EW	Elijah	Wanjiru	30965988	797306436	35	Male	mji_wa_huruma		None
HUR769PM	Pauline	Macharia	38631569	758805540	24	Female	mji_wa_huruma		None
HUR802SK	Sarah	Warurie	37192038	792217719	25	Female	mji_wa_huruma		None
HUR583FO	Faith	Otieno	41741232	704815936	23	Female	mji_wa_huruma		None
HUR672JM	JAMES	MUTHONI	30713242	740821911	31	Male	mji_wa_huruma		None
HUR761RM	RUTH	MUTHONI	464756966	114665648	19	Female	mji_wa_huruma		None
HUR429JN	JOHN	NGURE	38136262	713058307	25	Male	mji_wa_huruma		None
HUR777BW	Beatrice	Wanjiru	39339331	724976026	24	Female	mji_wa_huruma		None
HUR652MN	Monica	Ng'ang'a	42414934	700033052	21	Female	mji_wa_huruma		None
HUR715CW	Charles	Waithira	42129862	705295182	21	Male	mji_wa_huruma		None`;

async function analyzeYouth() {
  console.log('====================================');
  console.log('YOUTH ALLOCATION ANALYSIS');
  console.log('====================================\n');

  // Parse the data
  const lines = rawData.trim().split('\n');
  const youth = [];
  const missingIDs = [];
  const withDisabilities = [];
  
  lines.forEach((line, index) => {
    const parts = line.split('\t');
    if (parts.length < 7) return;

    const youthId = parts[0]?.trim();
    const firstName = parts[1]?.trim();
    const lastName = parts[2]?.trim();
    const idNumber = parts[3]?.trim();
    const phone = parts[4]?.trim();
    const age = parts[5]?.trim();
    const gender = parts[6]?.trim();
    const settlement = parts[7]?.trim();
    const ward = parts[8]?.trim();
    const disability = parts[9]?.trim();

    const record = {
      youthId,
      firstName,
      lastName,
      idNumber,
      phone,
      age: parseInt(age) || 0,
      gender,
      settlement,
      ward,
      disability,
      hasDisability: disability && disability !== 'None' && disability !== '',
    };

    youth.push(record);

    if (!youthId || youthId === '') {
      missingIDs.push(record);
    }

    if (record.hasDisability) {
      withDisabilities.push(record);
    }
  });

  console.log(`Total youth parsed: ${youth.length}`);
  console.log(`Youth with missing IDs: ${missingIDs.length}`);
  console.log(`Youth with disabilities: ${withDisabilities.length}\n`);

  // Get current digitization youth from database
  const digitizationQuery = await pool.query(`
    SELECT youth_id, full_name, osm_username, settlement, is_active
    FROM youth_participants
    WHERE program_type = 'digitization'
    ORDER BY youth_id
  `);

  const currentDigitization = digitizationQuery.rows;
  const activeDigitization = currentDigitization.filter(y => y.is_active);
  
  console.log('====================================');
  console.log('CURRENT DIGITIZATION MODULE');
  console.log('====================================');
  console.log(`Total registered in digitization: ${currentDigitization.length}`);
  console.log(`Active digitization youth: ${activeDigitization.length}\n`);

  // Find who is in the new list and already in digitization
  const youthInBothLists = youth.filter(y => 
    currentDigitization.some(d => d.youth_id === y.youthId)
  );

  console.log(`Youth in new list who are already in digitization: ${youthInBothLists.length}`);

  // Find dropouts (registered but not active/not in new list)
  const dropouts = currentDigitization.filter(d => 
    !youth.some(y => y.youthId === d.youth_id)
  );

  console.log(`\nDROPOUTS - Registered in digitization but not in new list:`);
  console.log(`Count: ${dropouts.length}\n`);
  dropouts.forEach(d => {
    console.log(`${d.youth_id} - ${d.full_name} (${d.settlement}) - Active: ${d.is_active}`);
  });

  // Settlement breakdown
  const kayole = youth.filter(y => y.settlement === 'kayole_soweto');
  const kariobangi = youth.filter(y => y.settlement === 'kariobangi');
  const huruma = youth.filter(y => y.settlement === 'mji_wa_huruma');

  console.log('\n====================================');
  console.log('SETTLEMENT BREAKDOWN');
  console.log('====================================');
  console.log(`Kayole Soweto: ${kayole.length}`);
  console.log(`Kariobangi: ${kariobangi.length}`);
  console.log(`Mji wa Huruma: ${huruma.length}\n`);

  // Module allocation plan
  console.log('====================================');
  console.log('MODULE ALLOCATION PLAN');
  console.log('====================================\n');

  // 1. Digitization - youth already in the system
  const forDigitization = youthInBothLists.filter(y => !y.hasDisability);
  console.log(`1. DIGITIZATION: ${forDigitization.length} youth`);
  console.log(`   (Youth already registered and active in digitization)\n`);

  // 2. Microtasking - all with disabilities
  const forMicrotasking = withDisabilities;
  console.log(`2. MICROTASKING: ${forMicrotasking.length} youth`);
  console.log(`   (All youth with disabilities)\n`);

  // 3. Remaining for Mobile Mapping and Household Survey
  const remaining = youth.filter(y => 
    !youthInBothLists.some(d => d.youthId === y.youthId) && 
    !y.hasDisability &&
    y.youthId && y.youthId !== ''
  );

  const halfRemaining = Math.floor(remaining.length / 2);
  const forMobileMapping = remaining.slice(0, halfRemaining);
  const forHouseholdSurvey = remaining.slice(halfRemaining);

  console.log(`3. MOBILE MAPPING: ${forMobileMapping.length} youth`);
  console.log(`   (50% of remaining after digitization and microtasking)\n`);

  console.log(`4. HOUSEHOLD SURVEY: ${forHouseholdSurvey.length} youth`);
  console.log(`   (50% of remaining after digitization and microtasking)\n`);

  console.log('====================================');
  console.log('SUMMARY');
  console.log('====================================');
  console.log(`Total youth to allocate: ${youth.length}`);
  console.log(`Digitization: ${forDigitization.length}`);
  console.log(`Microtasking: ${forMicrotasking.length}`);
  console.log(`Mobile Mapping: ${forMobileMapping.length}`);
  console.log(`Household Survey: ${forHouseholdSurvey.length}`);
  console.log(`Missing IDs (not allocated): ${missingIDs.length}`);
  console.log(`Total allocated: ${forDigitization.length + forMicrotasking.length + forMobileMapping.length + forHouseholdSurvey.length}\n`);

  // Save detailed results to files
  fs.writeFileSync('youth-analysis-missing-ids.json', JSON.stringify(missingIDs, null, 2));
  fs.writeFileSync('youth-analysis-dropouts.json', JSON.stringify(dropouts, null, 2));
  fs.writeFileSync('youth-analysis-digitization.json', JSON.stringify(forDigitization, null, 2));
  fs.writeFileSync('youth-analysis-microtasking.json', JSON.stringify(forMicrotasking, null, 2));
  fs.writeFileSync('youth-analysis-mobile-mapping.json', JSON.stringify(forMobileMapping, null, 2));
  fs.writeFileSync('youth-analysis-household-survey.json', JSON.stringify(forHouseholdSurvey, null, 2));

  console.log('Detailed files created:');
  console.log('- youth-analysis-missing-ids.json');
  console.log('- youth-analysis-dropouts.json');
  console.log('- youth-analysis-digitization.json');
  console.log('- youth-analysis-microtasking.json');
  console.log('- youth-analysis-mobile-mapping.json');
  console.log('- youth-analysis-household-survey.json\n');

  await pool.end();
}

analyzeYouth().catch(console.error);
