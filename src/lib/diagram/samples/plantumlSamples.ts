export const plantumlSamples: Record<string, string> = {
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/activity.puml
  'Activity (Legacy)': `@startuml
(*) -> activity
@enduml`,
  // Source: https://github.com/plantuml/plantuml-stdlib/blob/master/stdlib/archimate/_examples_/example.puml
  Archimate: `@startuml
!global $ARCH_LOCAL = %true()
!global $ARCH_DEBUG = %true()

!if ($ARCH_LOCAL == %false())
    !include <archimate/Archimate>
!else
    !include ../Archimate.puml
!endif

title Archimate Sample - Internet Browser

Business_Object(businessObject, "A Business Object")
Business_Process(someBusinessProcess,"Some Business Process")
Business_Service(itSupportService, "IT Support for Business (Application Service)")

Application_DataObject(dataObject, "Web Page Data%n()'on the fly'")
Application_Function(webpageBehaviour, "Web page behaviour")
Application_Component(ActivePartWebPage, "Active Part of the web page%n()'on the fly'")

Technology_Artifact(inMemoryItem,"in memory / 'on the fly' html/javascript")
Technology_Service(internetBrowser, "Internet Browser Generic & Plugin")
Technology_Service(internetBrowserPlugin, "Some Internet Browser Plugin")
Technology_Service(webServer, "Some web server")

Rel_Flow_Left(someBusinessProcess, businessObject, "")
Rel_Serving_Up(itSupportService, someBusinessProcess, "")
Rel_Specialization_Up(webpageBehaviour, itSupportService, "")
Rel_Flow_Right(dataObject, webpageBehaviour, "")
Rel_Specialization_Up(dataObject, businessObject, "")
Rel_Assignment_Left(ActivePartWebPage, webpageBehaviour, "")
Rel_Specialization_Up(inMemoryItem, dataObject, "")
Rel_Realization_Up(inMemoryItem, ActivePartWebPage, "")
Rel_Specialization_Right(inMemoryItem,internetBrowser, "")
Rel_Serving_Up(internetBrowser, webpageBehaviour, "")
Rel_Serving_Up(internetBrowserPlugin, webpageBehaviour, "")
Rel_Aggregation_Right(internetBrowser, internetBrowserPlugin, "")
Rel_Access_Up(webServer, inMemoryItem, "")
Rel_Serving_Up(webServer, internetBrowser, "")
@enduml`,
  // Source: https://plantuml.com/chronology-diagram
  Chronology: `@startchronology
concise "Delivery"
@0
Delivery is Idle
@10
Delivery is Active
@enduml`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/class.puml
  Class: `@startuml
class class
@enduml`,
  // Source: https://github.com/plantuml/plantuml/blob/master/src/test/java/nonreg/simple/ComponentExtraArrows_0001_Test.java
  Component: `@startuml
component A
component B
component C
component D

A -up-> B : > up arrow **missing**
B <-down- A : < up arrow works
B -right-> C : > right arrow works
C -down-> D : > down arrow works
D -left-> A : > left arrow **missing**
A <-right- D : < left arrow works

@enduml`,
  // Source: https://github.com/plantuml/plantuml/blob/master/src/test/java/dev/newline/deployment_mono_multi_line.java
  Deployment: `@startuml
!$var=" aaa \n bbb \n <u:blue>ccc \n <color:green>ddd <U+000A> eee"

node "$var" as a

node b [
$var
on multi-line context
]

node c [
<code>
$var
</code>
]
@enduml`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/ditaa.puml
  Ditaa: `@startditaa
+-------+
+ ditaa +
+-------+
@endditaa`,
  // Source: https://github.com/plantuml/plantuml/blob/master/src/test/java/test/test/PlantUmlTestUtilsTest.java
  EBNF: `@startebnf
title ebnf-Title
a=a*;
@endebnf`,
  // Source: https://plantuml.com/er-diagram
  'Entity Relationship': `@startuml
entity "USER" as user {
  * user_id
  --
  name
}
entity "ORDER" as order {
  * order_id
  --
  date
}
user ||--o{ order : places
@enduml`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/gantt.puml
  Gantt: `@startgantt
[gantt] lasts 5 days
@endgantt`,
  // Source: https://plantuml.com/ie-diagram
  'Information Engineering': `@startie
entity Person
entity Department
Person ||--o{ Department : works_in
@endie`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/json.puml
  JSON: `@startjson
["json"]
@endjson`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/math.puml
  Math: `@startmath
f(math)=1
@endmath`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/mindmap.puml
  Mindmap: `@startmindmap
* mindmap
@endmindmap`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/network.puml
  'Network (nwdiag)': `@startuml
nwdiag {
    network {
        network ;
    }
}
@enduml`,
  // Source: https://plantuml.com/object-diagram
  Object: `@startuml
object FirstObject
object "Second Object" as SO
FirstObject --> SO
@enduml`,
  // Source: https://plantuml.com/regex
  Regex: `@startregex
title Simple regex
/^abc.*$/
@endregex`,
  // Source: https://plantuml.com/sdl
  SDL: `@startsdl
  start
  send signal
  stop
@endsdl`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/sequence.puml
  Sequence: `@startuml
skinparam Footbox hide
sequence -> sequence
@enduml`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/state.puml
  State: `@startuml
[*] --> state
@enduml`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/timing.puml
  Timing: `@startuml
concise timing
@0
timing is _
@100
timing is _
@enduml`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/salt.puml
  'UI Mockups (salt)': `@startuml
salt
{
  [salt]
}
@enduml`,
  // Source: https://github.com/plantuml/plantuml-stdlib/blob/master/stdlib/bootstrap1.12.1/_examples_/example.puml
  Usecase: `@startuml
!include <bootstrap1.12.1/bootstrap>

usecase a as "<$bi-globe>"
usecase b as "<$bi-globe,scale=2.5>"
usecase c as "<$bi-globe{scale=2.5}>" #line:red

usecase d as "<$bi-bootstrap-fill>"
usecase e as "<$bi-bootstrap-fill{scale=2.5,color=blue}>"
usecase f as "<$bi-bootstrap-fill,scale=2.5,color=#00f>"
@enduml`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/wbs.puml
  WBS: `@startwbs
* wbs
@endwbs`,
  // Source: https://github.com/plantuml/plantuml-test/blob/main/src/test/resources/simple-diagrams/yaml.puml
  YAML: `@startyaml
yaml: _
@endyaml`
};
