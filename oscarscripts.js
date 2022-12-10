var columns=["title","year","directed by","pga","sag","dga","total","wins","acting","bigthree","bestpic","director","filmediting","screenplay","actor","actress","suppactor","suppactress","score","song","soundediting","soundmixing","productiondesign","cinematography","costumes","makeup","vfx"];
var controlclass=["notnom","nom","win","all"];
var controltext=["no nom","nom","won","all"];
var bigthreeclass=["notnom","win","all"];
var bigthreetext=["<3","all 3","all"];
var actingtext=["none","1-2",">2","all"];
var bestpictext=["no nom","nom","no win","won","all"];
var bestpicclass=["notnom","nom","notnom","win","all"];
var grid=[],years={},directors={},yearlist=[],directorlist=[],cellIDs={},sYear,sDirector,opt,limits={},lim,lm,ctrl;
var key="title";
var andor="or";
var showids=false;
var noLimit={total:true,wins:true};
var tbody=document.getElementById("filmlist");
var headers=document.getElementById("categories").getElementsByTagName("TD");
var controls=document.getElementById("only").getElementsByTagName("TD");
var andorcontrol=document.getElementById("andor");
var totallist=document.getElementById("total");
var mYears=document.getElementById("year");
var eYears=document.getElementById("eyear");
var mDirector=document.getElementById("director");
var prev=document.getElementById("prev");
var next=document.getElementById("next");
var showhide=document.getElementById("showOutside");
var showhidelims={pga:3,sag:3,dga:3};
var clearcontrol=document.getElementById("clear");
var loading=document.getElementById("loading");
loading.className="block";

for(var c=0;c<columns.length;c++) {
    if (columns[c]=="directed by") headers[c].id="dir";
    else headers[c].id=columns[c];
    controls[c].id=("tog-"+columns[c]);
    headers[c].addEventListener("click",changekey);
    if(controls[c].className=="all") limits[columns[c]]={ status:columns[c]=="bigthree"?2:columns[c]=="bestpic"?4:3, control: document.getElementById(("tog-"+columns[c])) };
}

andorcontrol.addEventListener("click",function(e) {
    e.preventDefault();
    if(andor=="or") {
        andor="and";
        andorcontrol.className="and";
        andorcontrol.innerHTML="AND";
    }
    else {
        andor="or";
        andorcontrol.className="or";
        andorcontrol.innerHTML="OR";
    }
    populate(mYears.value);
});

for(var limit in limits) {
    if(!noLimit[limit]) {
        ctrl=limits[limit].control;
        ctrl.addEventListener("click",function(e) {
            e.preventDefault();
            lm=e.target.id.split("-")[1];
            lim=limits[lm];
            if(lim.status==0) lim.status=(lm=="bigthree")?2:(lm=="bestpic")?4:3;
            else lim.status=(lim.status-1);
            e.target.className=(lm=="bigthree")?bigthreeclass[lim.status]:(lm=="bestpic")?bestpicclass[lim.status]:controlclass[lim.status];
            e.target.innerHTML=(lm=="bigthree")?bigthreetext[lim.status]:(lm=="acting")?actingtext[lim.status]:(lm=="bestpic")?bestpictext[lim.status]:controltext[lim.status];
            populate(mYears.value);
        });
    }
}

clear.addEventListener("click",function(e) {
    e.preventDefault();
    for(var limit in limits) {
        if (limit=="bigthree") {
            limits[limit].status=2;
            limits[limit].control.className=bigthreeclass[2];
            limits[limit].control.innerHTML=bigthreetext[2];
        }
        else if (limit=="bestpic") {
            limits[limit].status=4;
            limits[limit].control.className=bestpicclass[4];
            limits[limit].control.innerHTML=bestpictext[4];
        }
        else {
            limits[limit].status=3;
            limits[limit].control.className=controlclass[3];
            limits[limit].control.innerHTML=controltext[3];
        }
        populate(mYears.value);
    }
});

mYears.addEventListener("change",changeyear);
eYears.addEventListener("change",changeeyear);
mDirector.addEventListener("change",changedir);
prev.addEventListener("click",prevyear);
next.addEventListener("click",nextyear);
showhide.addEventListener("click",swapOutside);


var temp, sections=[];
for(var film in oFilms) {
    temp="";
    sections=[];
    sYear="y"+oFilms[film].year;
    sDirector=oFilms[film].dir;
    if(!years[sYear]) {
        yearlist.push(oFilms[film].year);
        years[sYear]=true;
    }
    if(sDirector&&!directors[sDirector]) {
        temp="";
        sections=[];
        if (sDirector.indexOf(".")>=0) {
            sections=sDirector.split(".");
            for(var con=0;con<sections.length;con++) {
                if(sections[con].charAt(0)==" ") sections[con]=sections[con].substring(1);
                if(con==(sections.length-1)) temp=sections[con]+sections[0];
            }
        }
        else temp=sDirector;
        directorlist.push([oFilms[film].dir,temp]);
        directors[sDirector]=temp;
    }
}
yearlist.sort();
yearlist.reverse();
for(var y=0;y<yearlist.length;y++) {
    opt=document.createElement("option");
    opt.value=yearlist[y];
    opt.innerHTML=yearlist[y];
    eopt=document.createElement("option");
    eopt.value=yearlist[y];
    eopt.innerHTML=yearlist[y];
    mYears.appendChild(opt);
    eYears.appendChild(eopt);
    mYears.value=curryear;
    eYears.value=curryear;
}

directorlist.sort(sortTheDirs);
for(var y=0;y<directorlist.length;y++) {
    opt=document.createElement("option");
    opt.value=directorlist[y][0];
    opt.innerHTML=directorlist[y][0];
    mDirector.appendChild(opt);
}

function populate(year,endyear,director) {
    loading.className="block";
    grid=[];
    var cats={total:0},thisfilm,thiscat;
    var osc=true;
    if(!year) var year=false;
    if(!endyear) var endyear=false;
    if(!director) var director=false;
    var list=[],row=[],text="",i,ii,f,film,cat,cell,total,big3,acting,wins,isyear,isdir,islimit,status,col;
    for(var limit in limits) if((limits[limit].status!=3&&limit!="bigthree"&&limit!="bestpic")||(limits[limit].status!=2&&limit=="bigthree")||(limits[limit].status!=4&&limit=="bestpic")) { cats[limit]=limits[limit].status; cats.total++; }
//    for(check in cats) {
//        for(i=0;i<categories.length;i++) if(categories[i].name==check) checks[check]=categories[i];
//    }
    for(var film in oFilms) {
        thisfilm=oFilms[film];
        var threecount,act;
        islimit=true;
        isyear=(!year||year==0||thisfilm.year>=year)&&(!endyear||endyear==0||thisfilm.year<=endyear);
        isdir=(!director||director==0||thisfilm.dir==director);
        if(cats.total>0&&andor=="or") {
            islimit=false;
            for(limit in cats) {
                thiscat=cats[limit];
                if(limit=="bigthree") {
                    threecount=0;
                    if(thisfilm["director"]) threecount++;
                    if(thisfilm["screenplay"]) threecount++;
                    if(thisfilm["filmediting"]) threecount++;
                    if((thiscat==0&&threecount<3)||(thiscat==1&&threecount==3)) islimit=true;
                }
                else if(limit=="acting") {
                    act=0;
                    if(thisfilm["actor"]) act+=(((thisfilm["actor"]%1)/.25)+1);
                    if(thisfilm["actress"]) act+=(((thisfilm["actress"]%1)/.25)+1);
                    if(thisfilm["suppactor"]) act+=(((thisfilm["suppactor"]%1)/.25)+1);
                    if(thisfilm["suppactress"]) act+=(((thisfilm["suppactress"]%1)/.25)+1);
                    if((thiscat==0&&act==0)||(thiscat==1&&act>0&&act<3)||(thiscat==2&&act>2)) islimit=true;
                }
                else if(limit=="bestpic") {
                    if(thisfilm["bestpic"]) {
                        if(thiscat==3&&thisfilm["bestpic"]==2) islimit=true;
                        else if(thiscat==2&&thisfilm["bestpic"]<2) islimit=true;
                        else if(thiscat==1&&thisfilm["bestpic"]>=1) islimit=true;
                    }
                    else if(thiscat==0||thiscat==2) islimit=true;
                }
                else if(thiscat==1&&thisfilm[limit]) islimit=true;
                else if(thiscat==2&&thisfilm[limit]>=2) islimit=true;
            }
        } else if(cats.total>0) {
            islimit=true;
            for(limit in cats) {
                thiscat=cats[limit];
                if(limit=="bigthree") {
                    threecount=0;
                    if(thisfilm["director"]) threecount++;
                    if(thisfilm["screenplay"]) threecount++;
                    if(thisfilm["filmediting"]) threecount++;
                    if((thiscat==0&&threecount==3)||(thiscat==1&&threecount<3)) islimit=false;
                }
                else if(limit=="acting") {
                    act=0;
                    if(thisfilm["actor"]) act+=(((thisfilm["actor"]%1)/.25)+1);
                    if(thisfilm["actress"]) act+=(((thisfilm["actress"]%1)/.25)+1);
                    if(thisfilm["suppactor"]) act+=(((thisfilm["suppactor"]%1)/.25)+1);
                    if(thisfilm["suppactress"]) act+=(((thisfilm["suppactress"]%1)/.25)+1);
                    if((thiscat==0&&act>0)||(thiscat==1&&(act==0||act>2))||(thiscat==2&&act<3)) islimit=false;
                }
                else if(limit=="bestpic") {
                    if(thisfilm["bestpic"]) {
                        if(thiscat==3&&thisfilm["bestpic"]<2) islimit=false;
                        else if(thiscat==2&&thisfilm["bestpic"]==2) islimit=false;
                        else if(thiscat==0) islimit=false;
                    }
                    else if (thiscat==1||thiscat==3) islimit=false;
                }
                else if(thiscat==0&&thisfilm[limit]) islimit=false;
                else if(thiscat==1&&limit!="total"&&!thisfilm[limit]) islimit=false;
                else if(thiscat==2&&limit!="total"&&(!thisfilm[limit]||thisfilm[limit]<2)) islimit=false;
            }
        }
        if(isyear&&isdir&&islimit) list.push(film);
    }
    for(i=0;i<list.length;i++) {
        f=oFilms[list[i]];
        total=0;
        big3=0;
        acting=0;
        wins=0;
        row=[]
        row["title"]=list[i];
        row["year"]=f.year;
        row["dir"]=f["dir"]==null?"-":f["dir"];
        for(ii=0;ii<columns.length;ii++) {
            col=columns[ii];
            osc=!(col=="dga"||col=="sag"||col=="pga");
            if(!row[col]&&col!="total"&&col!="wins"&&col!="bigthree"&&col!="directed by") {
               if(!f[col]) text="-";
               else {
                   switch(f[col]) {
                   case 1.25:
                       text="nom (2)";
                       break;
                   case 1.5:
                       text="nom (3)";
                       break;
                   case 2:
                       text="win";
                       break;
                   case 2.25:
                       text="win (2)";
                       break;
                   case 2.5:
                       text="win (3)";
                       break;
                   default:
                       text="nom";
                   }
                   total+=osc?(((f[col]%1)/.25)+1):0;
                   big3+=(col=="filmediting"||col=="director"||col=="screenplay")?1:0;
                   wins+=osc?(f[col]>=2?1:0):0;
                   if(col=="actor"||col=="actress"||col=="suppactor"||col=="suppactress") {
                       acting+=(((f[col]%1)/.25)+1);
                   }
               }
               row[col]=text;
            }
        }
        row["total"]=total;
        row["bigthree"]=big3;
        row["acting"]=acting;
        row["wins"]=wins;
        grid.push(row);
    }
    sortthegrid(key);
    totallist.innerHTML=list.length+" film"+(list.length==1?"":"s");
    return;
}

function sortthegrid(newkey) {
    key=newkey;
    grid.sort(sortbykey);
    drawtable();
}

function changekey(e) {
    var newkey=e.target.id;
    sortthegrid(newkey);
}

function changeyear(e) {
    var newyear=e.target.options[e.target.selectedIndex].value;
    if(eYears.value<newyear) eYears.value=newyear;
    populate(newyear,eYears.value,mDirector.value);
}

function changeeyear(e) {
    var newyear=e.target.options[e.target.selectedIndex].value;
    if(mYears.value>newyear) mYears.value=newyear;
    populate(mYears.value,newyear,mDirector.value);
}

function changedir(e) {
    var newdir=e.target.options[e.target.selectedIndex].value;
    populate(mYears.value,eYears.value,newdir);
}

function sortbykey(a,b) {
    switch(key) {
    case "total":
        var aSort=a[key];
        var bSort=b[key];
        break;
    case "bigthree":
        var aSort=a[key];
        var bSort=b[key];
        break;
    case "wins":
        var aSort=a[key];
        var bSort=b[key];
        break;
    case "acting":
        var aSort=a[key];
        var bSort=b[key];
        break;
    case "year":
        var aSort=a[key];
        var bSort=b[key];
        break;
    case "title":
        var aSort=b[key].toLowerCase();
        var bSort=a[key].toLowerCase();
        if(aSort.substring(0,4)=="the ") aSort=aSort.substring(4);
        else if(aSort.substring(0,2)=="a ") aSort=aSort.substring(2);
        if(bSort.substring(0,4)=="the ") bSort=bSort.substring(4);
        else if(bSort.substring(0,2)=="a ") bSort=bSort.substring(2);
        break;
    case "dir":
        if(!directors[a[key]]) return 1;
        if(!directors[b[key]]) return -1;
        var aSort=directors[b[key]].toLowerCase();
        var bSort=directors[a[key]].toLowerCase();
        break;
    default:
        if(a[key].indexOf("win")>=0) var aSort=2;
        else if(a[key].indexOf("nom")>=0) var aSort=1;
        else var aSort=0;
        if(b[key].indexOf("win")>=0) var bSort=2;
        else if(b[key].indexOf("nom")>=0) var bSort=1;
        else var bSort=0;
    }
    return bSort<aSort?-1:(aSort<bSort)?1:0;
}

function drawtable() {
    var row,cell,classes,classN="",cID="",text,c,div,link,y;
    cellIDs={pga:true,dga:true,sag:true};
    cellIDs["tog-pga"]=true;
    cellIDs["tog-sag"]=true;
    cellIDs["tog-dga"]=true;
    while(tbody.childNodes.length>0) tbody.removeChild(tbody.firstChild);
    for(var i=0;i<grid.length;i++) {
        film=grid[i];
        row=document.createElement("TR");
        if(film["bestpic"]=="win") row.className="winner";
        for(var ii=0;ii<columns.length;ii++) {
            cID="";
            c=columns[ii];
            classes=[];
            classN="";
            if(key==c) classes.push("sorted");
            if(ii==0) classes.push("first");
            if(c=="director"||c=="filmediting"||c=="screenplay") classes.push("bigthree");
            if(c=="pga"||c=="sag"||c=="dga") {
                cID=c+"-outside-"+i;
                cellIDs[cID]=true;
            }
            for(var iii=0;iii<classes.length;iii++) {
                if(classN.length>0) classN+=" ";
                classN+=classes[iii];
            }
            cell=document.createElement("TD");
            div=document.createElement("DIV");
            cell.appendChild(div);
            if(c=="year") {
                link=document.createElement("A");
                text=document.createTextNode(film[c]);
                link.appendChild(text);
                div.appendChild(link);
            }
            else if(c=="directed by") {
                text=document.createTextNode(film.dir);
                div.appendChild(text);
            }
            else {
                if(film[columns[ii]]!="") text=document.createTextNode(film[c]);
                else text=document.createTextNode("-");
                div.appendChild(text);
            }
            cell.className=classN;
            cell.id=cID;
            row.appendChild(cell);
        }
        tbody.appendChild(row);
    }
    if(!showids) {
        for (outcell in cellIDs) {
            document.getElementById(outcell).style.display="none";
        }
    }
    var links=tbody.getElementsByTagName("a");
    for(y=0;y<links.length;y++) {
        links[y].addEventListener("click",function(e) {
            e.preventDefault();
            populate(e.target.innerHTML);
            var opts=mYears.getElementsByTagName("OPTION");
            for(var yy=0;yy<opts.length;yy++) {
                if(opts[yy].value==e.target.innerHTML) opts[yy].selected=true;
            }
        });
    }
    loading.className="";
}

function nextyear(e) {
    e.preventDefault();
    var single=false;
    if(mYears.selectedIndex==eYears.selectedIndex) single=true;
    if(mYears.selectedIndex<=1) {
        if(mYears.selectedIndex==0) eYears.selectedIndex=0;
        return;
    } else {
       mYears.selectedIndex=(mYears.selectedIndex-1);
       if(single||eYears.selectedIndex<mYears.selectedIndex) eYears.selectedIndex=mYears.selectedIndex;
    }
    populate(mYears.options[mYears.selectedIndex].value,eYears.options[eYears.selectedIndex].value,mDirector.options[mDirector.selectedIndex].value);
}

function prevyear(e) {
    e.preventDefault();
    var single=false;
    if(mYears.selectedIndex==eYears.selectedIndex) single=true;
    if(mYears.selectedIndex==(mYears.length-1) || mYears.selectedIndex==0) return;
    else {
        mYears.selectedIndex=(mYears.selectedIndex+1);
        if(single||eYears.selectedIndex<mYears.selectedIndex) eYears.selectedIndex=mYears.selectedIndex;
    }
    populate(mYears.options[mYears.selectedIndex].value,eYears.options[eYears.selectedIndex].value,mDirector.options[mDirector.selectedIndex].value);
}

function swapOutside(e) {
    e.preventDefault();
    var lim;
    showids=!showids;
    for(var outcell in cellIDs) {
        document.getElementById(outcell).style.display=showids?"table-cell":"none";
    }
    while(showhide.childNodes.length) showhide.removeChild(showhide.childNodes[0]);
    showhide.appendChild(document.createTextNode(showids?"Hide outside awards":"Show outside awards"));
    if(!showids) {
        for (var limit in showhidelims) {
            lim=document.getElementById("tog-"+limit);
            limits[limit].status=3;
            lim.className="all";
            lim.innerHTML="All";
        }
    }
    populate(mYears.value);
}

function sortTheDirs(a,b) {
    var aSort=a[1].toLowerCase();
    var bSort=b[1].toLowerCase();
    return bSort>aSort?-1:(aSort>bSort)?1:0;
}
